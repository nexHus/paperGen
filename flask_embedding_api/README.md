# Flask Embedding API

This Flask API generates embeddings for text chunks using SentenceTransformers, with support for batch processing, similarity search, content clustering, and finding relevant curriculum content for question generation.

## Features

- **Text Embeddings**: Generate embeddings for single texts or batches
- **Similarity Search**: Find similar documents using cosine similarity
- **Content Clustering**: Group similar content together using K-Means
- **Relevant Content Search**: Find relevant curriculum content for specific topics
- **Model Info**: Get information about available embedding models

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
Generate embeddings for a list of texts.

**Request:**
```json
{
  "texts": ["text chunk 1", "text chunk 2", "..."],
  "normalize": true
}
```

**Response:**
```json
{
  "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
  "model": "all-MiniLM-L6-v2",
  "num_texts": 2,
  "embedding_dimension": 384,
  "normalized": true
}
```

### POST /embed/single
Generate embedding for a single text.

**Request:**
```json
{
  "text": "your text here",
  "normalize": true
}
```

### POST /embed/batch
Generate embeddings for large batches with chunking support.

**Request:**
```json
{
  "texts": ["text1", "text2", ...],
  "batch_size": 32,
  "normalize": true
}
```

### POST /similarity
Compute similarity between a query and documents.

**Request:**
```json
{
  "query": "What is photosynthesis?",
  "documents": ["doc1", "doc2", ...],
  "top_k": 5
}
```

**Response:**
```json
{
  "results": [
    {"document": "doc1", "index": 0, "score": 0.95},
    ...
  ],
  "query": "What is photosynthesis?",
  "model": "all-MiniLM-L6-v2"
}
```

### POST /similarity/embeddings
Compute similarity from pre-computed embeddings (useful with ChromaDB).

**Request:**
```json
{
  "query_embedding": [...],
  "document_embeddings": [[...], [...], ...],
  "top_k": 5
}
```

### POST /find-relevant-content
Find relevant content from documents based on topics.

**Request:**
```json
{
  "topics": ["photosynthesis", "cell division"],
  "documents": ["doc1 text", "doc2 text", ...],
  "top_k": 10
}
```

**Response:**
```json
{
  "relevant_content": [
    {
      "topic": "photosynthesis",
      "documents": [
        {"text": "...", "index": 0, "score": 0.95}
      ]
    }
  ]
}
```

### POST /cluster-content
Cluster similar content together using K-Means.

**Request:**
```json
{
  "documents": ["doc1", "doc2", ...],
  "num_clusters": 5
}
```

**Response:**
```json
{
  "clusters": [
    {
      "cluster_id": 0,
      "documents": [{"text": "...", "index": 0}, ...]
    }
  ]
}
```

### GET /model/info
Get detailed information about the loaded model.

### GET /health
Check API health and model status.

### GET /
API information and available endpoints.

## Models

You can use different SentenceTransformer models by setting the `EMBEDDING_MODEL` environment variable:

- `all-MiniLM-L6-v2` (default) - Fast, good quality, 384 dimensions
- `all-mpnet-base-v2` - Better quality, slower, 768 dimensions
- `multi-qa-MiniLM-L6-cos-v1` - Optimized for Q&A tasks
- `paraphrase-multilingual-MiniLM-L12-v2` - Multilingual support

## ChromaDB Integration

This API works seamlessly with ChromaDB for document storage and retrieval:

```bash
# Install ChromaDB
pip install chromadb

# Run ChromaDB server
chroma run --host localhost --port 8000
```

## Production Deployment

For production, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | SentenceTransformer model name |
| `PORT` | `5000` | Server port |
| `DEBUG` | `False` | Enable debug mode |

