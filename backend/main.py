import faiss
import numpy as np
import os
import requests
from sentence_transformers import SentenceTransformer
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import logging
import traceback
from dateutil import parser as date_parser
import json

# Custom JSON encoder to handle numpy types
def deep_convert_numpy_types(obj):
    """Recursively convert all numpy types to Python native types"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: deep_convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [deep_convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(deep_convert_numpy_types(item) for item in obj)
    else:
        return obj

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
    """Initialize the model and load found items from database"""
    global model
    try:
        logger.info("Starting automatic model loading and database sync...")
        
        # Load the embedding model on startup
        model_path = './models/all-MiniLM-L6-v2'
        if os.path.exists(model_path):
            model = SentenceTransformer(model_path)
        else:
            model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("SentenceTransformer model loaded successfully")
        
        # Load items from database
        await load_found_items_from_database()
        await load_lost_items_from_database()
        logger.info("Startup complete - model loaded and items synced")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        logger.error(traceback.format_exc())
        logger.warning("Startup failed, server will continue - model will load on first request")

def ensure_model_loaded():
    """Lazy load the model when needed"""
    global model
    if model is None:
        try:
            model_path = './models/all-MiniLM-L6-v2'
            if os.path.exists(model_path):
                model = SentenceTransformer(model_path)
            else:
                model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Model loading failed: {str(e)}")
    return model

# In-memory storage
found_items = []
lost_items = []
found_index = None
lost_index = None

# === Helper Functions ===
async def load_found_items_from_database():
    global found_items
    try:
        response = requests.get("http://localhost:3000/api/found?limit=1000")
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            found_items.clear()
            for item in items:
                found_items.append({
                    "id": str(item["_id"]),
                    "item": item["title"],
                    "description": item["description"],
                    "location": item["location"]["text"],
                    "date": item["createdAt"],
                    "type": "found",
                    "contact_info": item.get("contactInfo", {})
                })
            rebuild_found_index()
    except Exception as e:
        logger.error(f"Error loading found items: {e}")
        logger.error(traceback.format_exc())

async def load_lost_items_from_database():
    global lost_items
    try:
        response = requests.get("http://localhost:3000/api/lost?limit=1000")
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            lost_items.clear()
            for item in items:
                lost_items.append({
                    "id": str(item["_id"]),
                    "item": item["title"],
                    "description": item["description"],
                    "location": item["location"]["text"],
                    "date": item["createdAt"],
                    "type": "lost",
                    "contact_info": item.get("contactInfo", {})
                })
            rebuild_lost_index()
    except Exception as e:
        logger.error(f"Error loading lost items: {e}")
        logger.error(traceback.format_exc())

def rebuild_found_index():
    global found_index
    if not found_items:
        found_index = None
        return
    current_model = ensure_model_loaded()
    texts = [f"{item['item']} {item['description']} {item['location']}" for item in found_items]
    embeddings = current_model.encode(texts, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)
    found_index = faiss.IndexFlatIP(embeddings.shape[1])
    found_index.add(embeddings)

def rebuild_lost_index():
    global lost_index
    if not lost_items:
        lost_index = None
        return
    current_model = ensure_model_loaded()
    texts = [f"{item['item']} {item['description']} {item['location']}" for item in lost_items]
    embeddings = current_model.encode(texts, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)
    lost_index = faiss.IndexFlatIP(embeddings.shape[1])
    lost_index.add(embeddings)

def normalize_scores(scores):
    if not scores:
        return []
    scores_array = np.array(scores, dtype=np.float32)
    normalized_scores = (scores_array + 1.0) / 2.0
    enhanced_scores = 1.0 / (1.0 + np.exp(-10 * (normalized_scores - 0.7)))
    return [float(np.clip(s, 0.0, 1.0)) for s in enhanced_scores]

def parse_date_flexible(date_str: str) -> datetime:
    try:
        if 'Z' in date_str:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        elif '+' in date_str or date_str.endswith('00:00'):
            return datetime.fromisoformat(date_str)
        else:
            return date_parser.parse(date_str)
    except:
        return datetime.now()

# === Semantic Matching ===
def semantic_match_found_to_lost(found_item: Dict, top_k: int = 5) -> List[Dict]:
    """Pure semantic matching: found item → lost items"""
    if lost_index is None or not lost_items:
        return []
    current_model = ensure_model_loaded()
    query_text = f"{found_item['item']} {found_item['description']} {found_item['location']}"
    q_emb = current_model.encode([query_text], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    D, I = lost_index.search(q_emb, k=min(len(lost_items), top_k*2))
    if len(D[0]) == 0:
        return []
    text_scores_norm = normalize_scores([float(d) for d in D[0]])
    threshold = 0.6
    results = []
    for idx, text_score in zip(I[0], text_scores_norm):
        if idx >= len(lost_items) or text_score < threshold:
            continue
        lost_item = lost_items[idx]
        results.append({
            "score": float(text_score),
            "found_item": lost_item,
            "similarity_details": {"text_score": float(text_score)}
        })
    results.sort(key=lambda x: -x["score"])
    return results[:min(top_k, len(results))]

def semantic_match_lost_to_found(lost_item: Dict, top_k: int = 5) -> List[Dict]:
    """Pure semantic matching: lost item → found items"""
    if found_index is None or not found_items:
        return []
    current_model = ensure_model_loaded()
    query_text = f"{lost_item['item']} {lost_item['description']} {lost_item['location']}"
    q_emb = current_model.encode([query_text], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    D, I = found_index.search(q_emb, k=min(len(found_items), top_k*2))
    if len(D[0]) == 0:
        return []
    text_scores_norm = normalize_scores([float(d) for d in D[0]])
    threshold = 0.6
    results = []
    for idx, text_score in zip(I[0], text_scores_norm):
        if idx >= len(found_items) or text_score < threshold:
            continue
        found_item = found_items[idx]
        results.append({
            "score": float(text_score),
            "found_item": found_item,
            "similarity_details": {"text_score": float(text_score)}
        })
    results.sort(key=lambda x: -x["score"])
    return results[:min(top_k, len(results))]

# === Data Models ===
class Item(BaseModel):
    id: str
    item: str
    description: str
    location: str
    date: str
    type: str = "found"
    contact_info: Optional[Dict] = None

class LostQuery(BaseModel):
    id: str
    item: str
    description: str
    location: str
    date: str
    contact_info: Optional[Dict] = None

# === API Routes ===
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "found_items_count": len(found_items),
        "lost_items_count": len(lost_items),
        "found_index_built": found_index is not None,
        "lost_index_built": lost_index is not None
    }

@app.post("/add-found")
async def add_found(item: Item):
    found_items.append(item.dict())
    rebuild_found_index()
    return {"status": "success", "item_id": item.id, "total_found_items": len(found_items)}

@app.post("/add-lost")
async def add_lost(item: Item):
    lost_items.append(item.dict())
    rebuild_lost_index()
    return {"status": "success", "item_id": item.id, "total_lost_items": len(lost_items)}

@app.post("/match-lost", response_class=Response)
async def match_lost(query: LostQuery):
    matches = semantic_match_lost_to_found(query.dict(), top_k=5)
    response_data = deep_convert_numpy_types({
        "lost_item": query.dict(),
        "matches": matches,
        "total_found_items": len(found_items)
    })
    return Response(content=json.dumps(response_data), media_type="application/json")

@app.post("/match-found", response_class=Response)
async def match_found(query: LostQuery):
    matches = semantic_match_found_to_lost(query.dict(), top_k=5)
    response_data = deep_convert_numpy_types({
        "found_item": query.dict(),
        "matches": matches,
        "total_lost_items": len(lost_items)
    })
    return Response(content=json.dumps(response_data), media_type="application/json")

@app.get("/found-items")
async def get_found_items():
    return {"found_items": found_items, "count": len(found_items)}

@app.get("/lost-items")
async def get_lost_items():
    return {"lost_items": lost_items, "count": len(lost_items)}

@app.post("/sync")
async def sync_found_items():
    await load_found_items_from_database()
    await load_lost_items_from_database()
    return {
        "status": "success",
        "total_found_items": len(found_items),
        "total_lost_items": len(lost_items)
    }

@app.delete("/clear-index")
async def clear_index():
    global found_items, lost_items, found_index, lost_index
    found_items.clear()
    lost_items.clear()
    found_index = None
    lost_index = None
    return {"status": "success", "message": "All indexes cleared"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
