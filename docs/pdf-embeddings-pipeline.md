# PDF to Embeddings Pipeline

This system provides a complete pipeline for uploading PDFs, extracting text, generating embeddings, and storing them in ChromaDB for semantic search.

## Architecture

```
PDF Upload → Text Extraction → Text Chunking → Flask API (Embeddings) → ChromaDB → MongoDB
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret
JWT_SECRET=your_jwt_secret

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/papergenie

# Flask Embedding API
FLASK_EMBEDDING_API_URL=http://localhost:5000/embed

# ChromaDB Configuration
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=curriculum_documents
```

### 2. Start ChromaDB Server

```bash
# Install ChromaDB (if not already installed)
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000
```

### 3. Start Flask Embedding API

```bash
cd flask_embedding_api

# Create virtual environment
python -m venv embedding_env

# Activate virtual environment
# Windows:
embedding_env\Scripts\activate
# macOS/Linux:
source embedding_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask API
python app.py
```

### 4. Start Next.js Application

```bash
npm run dev
```

## API Endpoints

### Upload PDF and Generate Embeddings
**POST** `/api/curriculum/uploadFile`

Upload a PDF file and automatically:
- Extract text content
- Create text chunks
- Generate embeddings via Flask API
- Store in ChromaDB
- Save metadata to MongoDB

**Request:**
- Multipart form data with PDF file
- Field name can be: `file`, `pdf`, `document`, or `curriculum`

**Response:**
```json
{
  "type": "success",
  "message": "File uploaded, processed, and embeddings saved successfully",
  "data": {
    "fileUrl": "https://cloudinary.com/...",
    "fileName": "curriculum.pdf",
    "publicId": "curriculum_1234567890",
    "documentId": "curriculum_1234567890",
    "totalChunks": 25,
    "textPreview": "Chapter 1: Introduction..."
  }
}
```

### Search Documents
**POST** `/api/curriculum/search`

Search for similar content using semantic similarity.

**Request:**
```json
{
  "query": "What is photosynthesis?",
  "limit": 5
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Search completed successfully",
  "data": {
    "query": "What is photosynthesis?",
    "results": [
      {
        "text": "Photosynthesis is the process...",
        "metadata": {
          "documentId": "curriculum_1234567890",
          "fileName": "biology.pdf",
          "chunkIndex": 12
        },
        "distance": 0.25,
        "id": "curriculum_1234567890_chunk_12_1234567890"
      }
    ]
  }
}
```

## Frontend Usage

### Upload a PDF:
```javascript
const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/curriculum/uploadFile', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}` // if using auth
    }
  });

  return response.json();
};
```

### Search Documents:
```javascript
const searchDocuments = async (query) => {
  const response = await fetch('/api/curriculum/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      limit: 10
    })
  });

  return response.json();
};
```

## Text Processing

- **Chunk Size**: 1000 characters per chunk
- **Overlap**: 200 characters between chunks
- **Boundary Detection**: Attempts to break at sentence boundaries
- **Text Cleaning**: Removes excessive whitespace and special characters

## Embedding Model

The Flask API uses SentenceTransformers with the `all-MiniLM-L6-v2` model by default:
- **Dimensions**: 384
- **Performance**: Fast inference
- **Quality**: Good for most use cases

You can change the model by setting the `EMBEDDING_MODEL` environment variable in the Flask API.

## Troubleshooting

1. **ChromaDB Connection**: Ensure ChromaDB server is running on port 8000
2. **Flask API**: Ensure Flask server is running on port 5000
3. **File Upload Issues**: Check that the form field name matches expected names
4. **PDF Parsing**: Some PDFs might be image-based and won't extract text properly
5. **Environment Variables**: Make sure all required environment variables are set

## Dependencies

**Next.js:**
- `formidable` - File upload handling
- `pdf-parse` - PDF text extraction
- `chromadb` - Vector database client
- `cloudinary` - File storage

**Flask API:**
- `flask` - Web framework
- `flask-cors` - CORS handling
- `sentence-transformers` - Embedding generation
- `numpy` - Array operations
