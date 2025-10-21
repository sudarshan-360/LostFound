import os
import logging
from typing import List, Optional
from datetime import datetime

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import requests
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

try:
    import open_clip
    USE_OPEN_CLIP = True
except Exception:
    # Fallback to transformers if open_clip isn't available
    USE_OPEN_CLIP = False
    from transformers import CLIPModel, CLIPProcessor


class EmbedRequest(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None


class EmbedResponse(BaseModel):
    embedding: List[float]
    model: str


class CompareItem(BaseModel):
    id: str
    embedding: List[float]


class CompareRequest(BaseModel):
    query: List[float]
    items: List[CompareItem]


class CompareResult(BaseModel):
    id: str
    score: float


class CompareResponse(BaseModel):
    results: List[CompareResult]


app = FastAPI(
    title="CLIP Embedding Service",
    description="FastAPI service for generating CLIP embeddings and computing similarity",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track service statistics
stats = {
    "embed_count": 0,
    "compare_count": 0,
    "error_count": 0,
    "started_at": datetime.now().isoformat()
}


device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

MODEL_NAME = os.environ.get("CLIP_MODEL_NAME", "ViT-B-32")
MODEL_PRETRAINED = os.environ.get("CLIP_PRETRAINED", "laion2b_s34b_b79k")

logger.info(f"Loading CLIP model: {MODEL_NAME}")

try:
    if USE_OPEN_CLIP:
        logger.info(f"Using open_clip with pretrained: {MODEL_PRETRAINED}")
        model, _, preprocess = open_clip.create_model_and_transforms(
            MODEL_NAME, pretrained=MODEL_PRETRAINED
        )
        tokenizer = open_clip.get_tokenizer(MODEL_NAME)
        model = model.to(device)
        model.eval()  # Set to evaluation mode
    else:
        hf_model_name = os.environ.get("HF_CLIP_MODEL", "openai/clip-vit-base-patch32")
        logger.info(f"Using transformers CLIP: {hf_model_name}")
        model = CLIPModel.from_pretrained(hf_model_name).to(device)
        processor = CLIPProcessor.from_pretrained(hf_model_name)
        model.eval()  # Set to evaluation mode
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load CLIP model: {e}")
    raise


def _download_image(image_url: str) -> Image.Image:
    """Download and validate image from URL"""
    try:
        logger.debug(f"Downloading image from: {image_url[:100]}...")
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        logger.debug(f"Image downloaded successfully: {img.size}")
        return img
    except requests.exceptions.Timeout:
        logger.error(f"Timeout downloading image: {image_url}")
        raise HTTPException(status_code=408, detail="Image download timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download image: {e}")
        raise HTTPException(status_code=400, detail=f"Image download failed: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to process image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")


def _encode_text(text: str) -> torch.Tensor:
    """Encode text to normalized CLIP embedding"""
    try:
        if USE_OPEN_CLIP:
            tokens = tokenizer([text])
            with torch.no_grad():
                feats = model.encode_text(tokens.to(device))
            return feats / feats.norm(dim=-1, keepdim=True)
        else:
            inputs = processor(text=[text], images=None, return_tensors="pt")
            with torch.no_grad():
                feats = model.get_text_features(**{k: v.to(device) for k, v in inputs.items()})
            return feats / feats.norm(dim=-1, keepdim=True)
    except Exception as e:
        logger.error(f"Text encoding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text encoding error: {str(e)}")


def _encode_image(image: Image.Image) -> torch.Tensor:
    """Encode image to normalized CLIP embedding"""
    try:
        if USE_OPEN_CLIP:
            image_tensor = preprocess(image).unsqueeze(0).to(device)
            with torch.no_grad():
                feats = model.encode_image(image_tensor)
            return feats / feats.norm(dim=-1, keepdim=True)
        else:
            inputs = processor(text=None, images=image, return_tensors="pt")
            with torch.no_grad():
                feats = model.get_image_features(**{k: v.to(device) for k, v in inputs.items()})
            return feats / feats.norm(dim=-1, keepdim=True)
    except Exception as e:
        logger.error(f"Image encoding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image encoding error: {str(e)}")


@app.get("/health")
def health():
    """Health check endpoint with service statistics"""
    return {
        "status": "ok",
        "device": device,
        "model": MODEL_NAME,
        "pretrained": MODEL_PRETRAINED if USE_OPEN_CLIP else "huggingface",
        "stats": stats,
        "cuda_available": torch.cuda.is_available()
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    """Generate CLIP embedding from text and/or image"""
    logger.info(f"Embed request - text: {bool(req.text)}, image: {bool(req.image_url)}")
    
    if not req.text and not req.image_url:
        stats["error_count"] += 1
        raise HTTPException(status_code=400, detail="Provide text and/or image_url")

    try:
        parts = []
        if req.text:
            logger.debug(f"Encoding text: {req.text[:100]}...")
            parts.append(_encode_text(req.text))
        if req.image_url:
            img = _download_image(req.image_url)
            parts.append(_encode_image(img))

        # Average the normalized parts if both exist
        vec = torch.stack(parts).mean(dim=0)
        vec = vec[0]  # remove batch dim
        
        embedding_list = vec.cpu().tolist()
        stats["embed_count"] += 1
        
        logger.info(f"Embedding generated successfully - dimension: {len(embedding_list)}")
        return EmbedResponse(embedding=embedding_list, model=MODEL_NAME)
    
    except HTTPException:
        raise
    except Exception as e:
        stats["error_count"] += 1
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")


@app.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    """Compute cosine similarity between query embedding and item embeddings"""
    logger.info(f"Compare request - query dim: {len(req.query)}, items: {len(req.items)}")
    
    if not req.query:
        stats["error_count"] += 1
        raise HTTPException(status_code=400, detail="Query embedding is empty")
    
    if not req.items:
        stats["error_count"] += 1
        raise HTTPException(status_code=400, detail="No items to compare")
    
    try:
        q = torch.tensor(req.query, dtype=torch.float32).unsqueeze(0)
        q = q / q.norm(dim=-1, keepdim=True)
        
        results: List[CompareResult] = []
        for item in req.items:
            if not item.embedding:
                logger.warning(f"Item {item.id} has empty embedding, skipping")
                continue
                
            v = torch.tensor(item.embedding, dtype=torch.float32).unsqueeze(0)
            v = v / v.norm(dim=-1, keepdim=True)
            score = torch.nn.functional.cosine_similarity(q, v).item()
            results.append(CompareResult(id=item.id, score=float(score)))
        
        results.sort(key=lambda r: r.score, reverse=True)
        stats["compare_count"] += 1
        
        logger.info(f"Comparison complete - {len(results)} scores computed")
        if results:
            logger.info(f"Top score: {results[0].score:.3f} (id: {results[0].id})")
        
        return CompareResponse(results=results)
    
    except Exception as e:
        stats["error_count"] += 1
        logger.error(f"Comparison failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    logger.info(f"Starting CLIP service on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")