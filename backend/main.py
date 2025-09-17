import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import logging
import traceback
from dateutil import parser as date_parser

# === Setup ===
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lost & Found FAISS Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model with error handling
model = None

@app.on_event("startup")
async def startup_event():
    global model
    try:
        logger.info("Loading SentenceTransformer model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise e

# In-memory storage
found_items = []   # Store found items
lost_items = []    # Store lost items for reference
found_index = None # FAISS index for found items
lost_index = None  # FAISS index for lost items

# === Data Models ===
class Item(BaseModel):
    id: str
    item: str
    description: str
    location: str
    date: str   # ISO string
    type: str = "found"  # "found" or "lost"
    contact_info: Optional[Dict] = None

class LostQuery(BaseModel):
    id: str
    item: str
    description: str
    location: str
    date: str
    contact_info: Optional[Dict] = None

class MatchResult(BaseModel):
    score: float
    found_item: Item
    similarity_details: Dict

class MatchResponse(BaseModel):
    lost_item: LostQuery
    matches: List[MatchResult]
    total_found_items: int

# === Helper Functions ===
def normalize_scores(scores):
    """Normalize scores to 0-1 range"""
    if not scores:
        return []
    min_s, max_s = min(scores), max(scores)
    if max_s - min_s == 0:
        return [1.0 for _ in scores]
    return [(s - min_s) / (max_s - min_s) for s in scores]

def rebuild_found_index():
    """Rebuild FAISS index with current found items"""
    global found_index
    
    try:
        if not found_items or model is None:
            found_index = None
            logger.info("No found items or model not loaded - found index cleared")
            return
        
        # Create text embeddings
        texts = [f"{item['item']} {item['description']} {item['location']}" for item in found_items]
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # Ensure embeddings are valid
        if embeddings.size == 0:
            found_index = None
            logger.warning("Empty embeddings generated")
            return
            
        faiss.normalize_L2(embeddings)
        
        # Create and populate index
        found_index = faiss.IndexFlatIP(embeddings.shape[1])
        found_index.add(embeddings)
        
        logger.info(f"FAISS found index rebuilt with {len(found_items)} found items")
    except Exception as e:
        logger.error(f"Error rebuilding found index: {e}")
        logger.error(traceback.format_exc())
        found_index = None

def rebuild_lost_index():
    """Rebuild FAISS index with current lost items"""
    global lost_index
    
    try:
        if not lost_items or model is None:
            lost_index = None
            logger.info("No lost items or model not loaded - lost index cleared")
            return
        
        # Create text embeddings
        texts = [f"{item['item']} {item['description']} {item['location']}" for item in lost_items]
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # Ensure embeddings are valid
        if embeddings.size == 0:
            lost_index = None
            logger.warning("Empty embeddings generated")
            return
            
        faiss.normalize_L2(embeddings)
        
        # Create and populate index
        lost_index = faiss.IndexFlatIP(embeddings.shape[1])
        lost_index.add(embeddings)
        
        logger.info(f"FAISS lost index rebuilt with {len(lost_items)} lost items")
    except Exception as e:
        logger.error(f"Error rebuilding lost index: {e}")
        logger.error(traceback.format_exc())
        lost_index = None

def parse_date_flexible(date_str: str) -> datetime:
    """Parse date string with multiple formats"""
    try:
        # Try ISO format first
        if 'Z' in date_str:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        elif '+' in date_str or date_str.endswith('00:00'):
            return datetime.fromisoformat(date_str)
        else:
            # Use dateutil parser for flexible parsing
            return date_parser.parse(date_str)
    except Exception as e:
        logger.warning(f"Date parsing failed for '{date_str}': {e}")
        # Return current time as fallback
        return datetime.now()

def weighted_match_lost_to_found(lost_item: Dict, top_k: int = 5) -> List[MatchResult]:
    """Find found items that match a lost item using weighted similarity"""
    try:
        if found_index is None or not found_items or model is None:
            logger.info("No found index, items, or model available for matching")
            return []

        # Embed lost item
        query_text = f"{lost_item['item']} {lost_item['description']} {lost_item['location']}"
        q_emb = model.encode([query_text], convert_to_numpy=True)
        faiss.normalize_L2(q_emb)

        # FAISS search
        search_k = min(len(found_items), max(top_k * 2, 1))  # Ensure at least 1
        D, I = found_index.search(q_emb, k=search_k)
        
        if len(D[0]) == 0:
            logger.info("No FAISS search results returned")
            return []
        
        # Normalize text similarity scores
        text_scores_norm = normalize_scores(list(D[0]))

        results = []
        lost_date = parse_date_flexible(lost_item["date"])

        for idx, text_score in zip(I[0], text_scores_norm):
            if idx >= len(found_items):
                continue
                
            found_item = found_items[idx]
            
            # Location similarity (exact match = 1.0, partial = 0.5, different = 0.0)
            lost_loc = lost_item["location"].lower().strip()
            found_loc = found_item["location"].lower().strip()
            
            if lost_loc == found_loc:
                loc_score = 1.0
            elif lost_loc in found_loc or found_loc in lost_loc:
                loc_score = 0.5
            else:
                loc_score = 0.0
            
            # Date similarity (closer dates = higher score)
            try:
                found_date = parse_date_flexible(found_item["date"])
                days_diff = abs((lost_date - found_date).days)
                date_score = max(0, 1 - (days_diff / 30))  # 30 days max influence
            except Exception as e:
                logger.warning(f"Date comparison failed: {e}")
                date_score = 0.5  # Default if date parsing fails
            
            # Combined score with weights
            combined_score = (
                text_score * 0.6 +      # Text similarity (60%)
                loc_score * 0.3 +       # Location similarity (30%)
                date_score * 0.1        # Date similarity (10%)
            )
            
            # Only include items with reasonable similarity
            if combined_score > 0.1:
                results.append(MatchResult(
                    score=combined_score,
                    found_item=Item(**found_item),
                    similarity_details={
                        "text_similarity": text_score,
                        "location_similarity": loc_score,
                        "date_similarity": date_score
                    }
                ))

        # Sort by combined score and return top results
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
    
    except Exception as e:
        logger.error(f"Error in weighted_match_lost_to_found: {e}")
        logger.error(traceback.format_exc())
        return []

def weighted_match_found_to_lost(found_item: Dict, top_k: int = 5) -> List[MatchResult]:
    """Find lost items that match a found item using weighted similarity"""
    try:
        if lost_index is None or not lost_items or model is None:
            logger.info("No lost index, items, or model available for matching")
            return []

        # Embed found item
        query_text = f"{found_item['item']} {found_item['description']} {found_item['location']}"
        q_emb = model.encode([query_text], convert_to_numpy=True)
        faiss.normalize_L2(q_emb)

        # FAISS search
        search_k = min(len(lost_items), max(top_k * 2, 1))  # Ensure at least 1
        D, I = lost_index.search(q_emb, k=search_k)
        
        if len(D[0]) == 0:
            logger.info("No FAISS search results returned")
            return []
        
        # Normalize text similarity scores
        text_scores_norm = normalize_scores(list(D[0]))

        results = []
        found_date = parse_date_flexible(found_item["date"])

        for idx, text_score in zip(I[0], text_scores_norm):
            if idx >= len(lost_items):
                continue
                
            lost_item = lost_items[idx]
            
            # Location similarity (exact match = 1.0, partial = 0.5, different = 0.0)
            found_loc = found_item["location"].lower().strip()
            lost_loc = lost_item["location"].lower().strip()
            
            if found_loc == lost_loc:
                loc_score = 1.0
            elif found_loc in lost_loc or lost_loc in found_loc:
                loc_score = 0.5
            else:
                loc_score = 0.0
            
            # Date similarity (closer dates = higher score)
            try:
                lost_date = parse_date_flexible(lost_item["date"])
                days_diff = abs((found_date - lost_date).days)
                date_score = max(0, 1 - (days_diff / 30))  # 30 days max influence
            except Exception as e:
                logger.warning(f"Date comparison failed: {e}")
                date_score = 0.5  # Default if date parsing fails
            
            # Combined score with weights
            combined_score = (
                text_score * 0.6 +      # Text similarity (60%)
                loc_score * 0.3 +       # Location similarity (30%)
                date_score * 0.1        # Date similarity (10%)
            )
            
            # Only include items with reasonable similarity
            if combined_score > 0.1:
                results.append(MatchResult(
                    score=combined_score,
                    found_item=Item(**lost_item),  # Note: using found_item field for lost items
                    similarity_details={
                        "text_similarity": text_score,
                        "location_similarity": loc_score,
                        "date_similarity": date_score
                    }
                ))

        # Sort by combined score and return top results
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
    
    except Exception as e:
        logger.error(f"Error in weighted_match_found_to_lost: {e}")
        logger.error(traceback.format_exc())
        return []

# === API Routes ===
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Lost & Found FAISS Service", 
        "model_loaded": model is not None,
        "found_items_count": len(found_items),
        "lost_items_count": len(lost_items),
        "found_index_built": found_index is not None,
        "lost_index_built": lost_index is not None
    }

@app.post("/add-found", response_model=Dict)
async def add_found(item: Item):
    """Add a found item to the FAISS index"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded yet")
            
        # Convert to dict and add to storage
        item_dict = item.dict()
        found_items.append(item_dict)
        
        # Rebuild found index
        rebuild_found_index()
        
        logger.info(f"Added found item: {item.id}")
        return {
            "status": "success",
            "message": "Found item added successfully",
            "item_id": item.id,
            "total_found_items": len(found_items)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding found item: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error adding found item: {str(e)}")

@app.post("/add-lost", response_model=Dict)
async def add_lost(item: Item):
    """Add a lost item to the FAISS index"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded yet")
            
        # Convert to dict and add to storage
        item_dict = item.dict()
        lost_items.append(item_dict)
        
        # Rebuild lost index
        rebuild_lost_index()
        
        logger.info(f"Added lost item: {item.id}")
        return {
            "status": "success",
            "message": "Lost item added successfully",
            "item_id": item.id,
            "total_lost_items": len(lost_items)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding lost item: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error adding lost item: {str(e)}")

@app.post("/match-lost", response_model=MatchResponse)
async def match_lost(query: LostQuery):
    """Find matches for a lost item"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded yet")
            
        logger.info(f"Finding matches for lost item: {query.item}")
        matches = weighted_match_lost_to_found(query.dict(), top_k=5)
        
        logger.info(f"Found {len(matches)} matches for lost item")
        return MatchResponse(
            lost_item=query,
            matches=matches,
            total_found_items=len(found_items)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error finding matches: {str(e)}")

@app.post("/match-found", response_model=MatchResponse)
async def match_found(query: LostQuery):  # Reusing LostQuery for found items
    """Find matches for a found item"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded yet")
            
        logger.info(f"Finding matches for found item: {query.item}")
        matches = weighted_match_found_to_lost(query.dict(), top_k=5)
        
        logger.info(f"Found {len(matches)} matches for found item")
        return MatchResponse(
            lost_item=query,  # This will contain the found item data
            matches=matches,
            total_found_items=len(lost_items)  # This will be the count of lost items
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error finding matches: {str(e)}")

@app.get("/found-items")
async def get_found_items():
    """Get all found items (for debugging)"""
    return {
        "found_items": found_items,
        "count": len(found_items)
    }

@app.get("/lost-items")
async def get_lost_items():
    """Get all lost items (for debugging)"""
    return {
        "lost_items": lost_items,
        "count": len(lost_items)
    }

@app.delete("/clear-index")
async def clear_index():
    """Clear all items and rebuild indexes (for testing)"""
    global found_items, lost_items, found_index, lost_index
    found_items.clear()
    lost_items.clear()
    found_index = None
    lost_index = None
    return {"status": "success", "message": "All indexes cleared"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
