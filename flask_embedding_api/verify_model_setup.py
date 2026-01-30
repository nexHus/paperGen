
import sys
import os
import time

def test_model():
    print("1. Importing sentence_transformers...")
    start_time = time.time()
    try:
        from sentence_transformers import SentenceTransformer
        print(f"   Import successful ({time.time() - start_time:.2f}s)")
    except ImportError as e:
        print(f"   FAILED to import: {e}")
        return False

    print("2. Loading model 'all-MiniLM-L6-v2'...")
    start_time = time.time()
    try:
        # This will download the model if not present
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print(f"   Model loaded successfully ({time.time() - start_time:.2f}s)")
    except Exception as e:
        print(f"   FAILED to load model: {e}")
        return False

    print("3. Testing encoding...")
    try:
        sentences = ["This is a test sentence.", "PaperGenie is awesome."]
        embeddings = model.encode(sentences)
        print(f"   Encoding successful. Shape: {embeddings.shape}")
        print(f"   First embedding vector length: {len(embeddings[0])}")
    except Exception as e:
        print(f"   FAILED to encode: {e}")
        return False

    print("\nSUCCESS: Local embedding model is working correctly!")
    return True

if __name__ == "__main__":
    test_model()
