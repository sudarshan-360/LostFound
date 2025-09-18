#!/usr/bin/env python
"""
Script to download SentenceTransformer model and save it locally.
Run this script once to download the model to a local directory.
"""

import os
import shutil
from sentence_transformers import SentenceTransformer
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
MODEL_NAME = "all-MiniLM-L6-v2"
LOCAL_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", MODEL_NAME)

def download_model():
    """Download the model and save it to the local directory"""
    try:
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(LOCAL_MODEL_DIR), exist_ok=True)
        
        # Check if model already exists locally
        if os.path.exists(LOCAL_MODEL_DIR):
            logger.info(f"Model already exists at {LOCAL_MODEL_DIR}")
            return LOCAL_MODEL_DIR
        
        logger.info(f"Downloading model {MODEL_NAME}...")
        
        # This will download the model to the default cache directory
        model = SentenceTransformer(MODEL_NAME)
        
        # Create our local model directory
        os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)
        
        # Save the model directly to our local directory
        logger.info(f"Saving model to {LOCAL_MODEL_DIR}...")
        model.save(LOCAL_MODEL_DIR)
        
        logger.info(f"Model successfully saved to {LOCAL_MODEL_DIR}")
        return LOCAL_MODEL_DIR
        
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        raise

def get_huggingface_cache_path():
    """Return the path to the HuggingFace cache directory"""
    from huggingface_hub import constants
    return constants.HF_HOME

def clear_huggingface_cache():
    """Clear the HuggingFace cache after copying the model"""
    try:
        cache_path = get_huggingface_cache_path()
        logger.info(f"HuggingFace cache is located at: {cache_path}")
        logger.info("To clear the cache, you can manually delete this directory or specific model folders within it.")
        logger.info("WARNING: Only do this if you've confirmed the model works from your local directory!")
    except Exception as e:
        logger.error(f"Error getting cache path: {e}")

if __name__ == "__main__":
    model_path = download_model()
    print(f"\nModel downloaded and saved to: {model_path}")
    print("\nYou can now use this local model in your application.")
    print("\nTo clear the HuggingFace cache (optional):")
    clear_huggingface_cache()