# Flask Embedding API

This Flask API generates embeddings for text chunks using SentenceTransformers.

## Setup

1. **Create a Python virtual environment:**
```bash
cd flask_embedding_api
python -m venv embedding_env
```

2. **Activate the virtual environment:**
```bash
# Windows
embedding_env\Scripts\activate

# macOS/Linux
source embedding_env/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set environment variables (optional):**
```bash
# Default model is 'all-MiniLM-L6-v2'
export EMBEDDING_MODEL=all-MiniLM-L6-v2
export PORT=5000
export DEBUG=False
```

5. **Run the Flask API:**
```bash
python app.py
```

The API will start on `http://localhost:5000`

## API Endpoints

### POST /embed
Generate embeddings for text chunks.

**Request:**
```json
{
  "texts": ["text chunk 1", "text chunk 2", "..."]
}
```

**Response:**
```json
{
  "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
  "model": "all-MiniLM-L6-v2",
  "num_texts": 2,
  "embedding_dimension": 384
}
```

### GET /health
Check API health and model info.

### GET /
API information and available endpoints.

## Models

You can use different SentenceTransformer models by setting the `EMBEDDING_MODEL` environment variable:

- `all-MiniLM-L6-v2` (default) - Fast, good quality, 384 dimensions
- `all-mpnet-base-v2` - Better quality, slower, 768 dimensions
- `multi-qa-MiniLM-L6-cos-v1` - Optimized for Q&A tasks

## ChromaDB Setup

Make sure you have ChromaDB running:

```bash
# Install ChromaDB
pip install chromadb

# Run ChromaDB server
chroma run --host localhost --port 8000
```
