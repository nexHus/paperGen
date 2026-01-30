
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info("Importing SentenceTransformer...")
    from sentence_transformers import SentenceTransformer
    
    logger.info("Loading model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    logger.info("Model loaded successfully.")
    
    text = "This is a test sentence to verify the model."
    logger.info(f"Generating embedding for: '{text}'")
    
    embedding = model.encode(text)
    
    logger.info(f"Embedding generated. Shape: {embedding.shape}")
    logger.info("Test PASSED: Local model is working.")
    
except Exception as e:
    logger.error(f"Test FAILED: {str(e)}")
    sys.exit(1)
