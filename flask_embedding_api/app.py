"""
Flask API for generating text embeddings
This is a complete Flask server that receives text chunks and returns embeddings
with support for batch processing, similarity search, and model management.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from sentence_transformers import SentenceTransformer
import numpy as np
from functools import lru_cache
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load the embedding model (you can use different models)
# Popular options: 'all-MiniLM-L6-v2', 'all-mpnet-base-v2', 'multi-qa-MiniLM-L6-cos-v1'
MODEL_NAME = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
model = None

def get_model():
    """Lazy load the model to improve startup time"""
    global model
    if model is None:
        logger.info(f"Loading model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME)
        logger.info(f"Model loaded successfully. Embedding dimension: {model.get_sentence_embedding_dimension()}")
    return model

# Initialize model at startup
get_model()


@app.route('/embed', methods=['POST'])
def generate_embeddings():
    """
    Generate embeddings for a list of text chunks.
    
    Request body:
    {
        "texts": ["text1", "text2", ...],
        "normalize": true/false (optional, default: true)
    }
    
    Response:
    {
        "embeddings": [[...], [...], ...],
        "model": "model_name",
        "num_texts": n,
        "embedding_dimension": d
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({
                'error': 'Missing texts in request body'
            }), 400
        
        texts = data['texts']
        normalize = data.get('normalize', True)
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({
                'error': 'texts must be a non-empty list'
            }), 400
        
        # Validate all texts are strings
        if not all(isinstance(t, str) for t in texts):
            return jsonify({
                'error': 'All items in texts must be strings'
            }), 400
        
        # Generate embeddings
        current_model = get_model()
        embeddings = current_model.encode(
            texts, 
            normalize_embeddings=normalize,
            show_progress_bar=False
        )
        
        # Convert numpy arrays to lists for JSON serialization
        embeddings_list = embeddings.tolist()
        
        return jsonify({
            'embeddings': embeddings_list,
            'model': MODEL_NAME,
            'num_texts': len(texts),
            'embedding_dimension': len(embeddings_list[0]) if embeddings_list else 0,
            'normalized': normalize
        })
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return jsonify({
            'error': f'Failed to generate embeddings: {str(e)}'
        }), 500


@app.route('/embed/single', methods=['POST'])
def generate_single_embedding():
    """
    Generate embedding for a single text.
    
    Request body:
    {
        "text": "your text here",
        "normalize": true/false (optional, default: true)
    }
    
    Response:
    {
        "embedding": [...],
        "model": "model_name",
        "embedding_dimension": d
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing text in request body'
            }), 400
        
        text = data['text']
        normalize = data.get('normalize', True)
        
        if not isinstance(text, str) or len(text.strip()) == 0:
            return jsonify({
                'error': 'text must be a non-empty string'
            }), 400
        
        # Generate embedding
        current_model = get_model()
        embedding = current_model.encode(
            text, 
            normalize_embeddings=normalize,
            show_progress_bar=False
        )
        
        # Convert numpy array to list for JSON serialization
        embedding_list = embedding.tolist()
        
        return jsonify({
            'embedding': embedding_list,
            'model': MODEL_NAME,
            'embedding_dimension': len(embedding_list),
            'normalized': normalize
        })
        
    except Exception as e:
        logger.error(f"Error generating single embedding: {str(e)}")
        return jsonify({
            'error': f'Failed to generate embedding: {str(e)}'
        }), 500


@app.route('/embed/batch', methods=['POST'])
def generate_batch_embeddings():
    """
    Generate embeddings for large batches of text with chunking support.
    Useful for processing large documents.
    
    Request body:
    {
        "texts": ["text1", "text2", ...],
        "batch_size": 32 (optional, default: 32),
        "normalize": true/false (optional, default: true)
    }
    
    Response:
    {
        "embeddings": [[...], [...], ...],
        "model": "model_name",
        "num_texts": n,
        "embedding_dimension": d,
        "batches_processed": b
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({
                'error': 'Missing texts in request body'
            }), 400
        
        texts = data['texts']
        batch_size = data.get('batch_size', 32)
        normalize = data.get('normalize', True)
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({
                'error': 'texts must be a non-empty list'
            }), 400
        
        if not isinstance(batch_size, int) or batch_size < 1:
            return jsonify({
                'error': 'batch_size must be a positive integer'
            }), 400
        
        # Validate all texts are strings
        if not all(isinstance(t, str) for t in texts):
            return jsonify({
                'error': 'All items in texts must be strings'
            }), 400
        
        current_model = get_model()
        all_embeddings = []
        num_batches = 0
        
        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = current_model.encode(
                batch, 
                normalize_embeddings=normalize,
                show_progress_bar=False
            )
            all_embeddings.extend(batch_embeddings.tolist())
            num_batches += 1
        
        return jsonify({
            'embeddings': all_embeddings,
            'model': MODEL_NAME,
            'num_texts': len(texts),
            'embedding_dimension': len(all_embeddings[0]) if all_embeddings else 0,
            'batches_processed': num_batches,
            'normalized': normalize
        })
        
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        return jsonify({
            'error': f'Failed to generate batch embeddings: {str(e)}'
        }), 500


@app.route('/similarity', methods=['POST'])
def compute_similarity():
    """
    Compute cosine similarity between a query and a list of documents.
    
    Request body:
    {
        "query": "query text",
        "documents": ["doc1", "doc2", ...],
        "top_k": 5 (optional, default: all)
    }
    
    Response:
    {
        "results": [
            {"document": "doc1", "index": 0, "score": 0.95},
            ...
        ],
        "query": "query text",
        "model": "model_name"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data or 'documents' not in data:
            return jsonify({
                'error': 'Missing query or documents in request body'
            }), 400
        
        query = data['query']
        documents = data['documents']
        top_k = data.get('top_k', len(documents))
        
        if not isinstance(query, str) or len(query.strip()) == 0:
            return jsonify({
                'error': 'query must be a non-empty string'
            }), 400
        
        if not isinstance(documents, list) or len(documents) == 0:
            return jsonify({
                'error': 'documents must be a non-empty list'
            }), 400
        
        current_model = get_model()
        
        # Generate embeddings
        query_embedding = current_model.encode(query, normalize_embeddings=True)
        doc_embeddings = current_model.encode(documents, normalize_embeddings=True)
        
        # Compute cosine similarities
        similarities = np.dot(doc_embeddings, query_embedding)
        
        # Sort by similarity score (descending)
        sorted_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in sorted_indices:
            results.append({
                'document': documents[idx],
                'index': int(idx),
                'score': float(similarities[idx])
            })
        
        return jsonify({
            'results': results,
            'query': query,
            'model': MODEL_NAME,
            'total_documents': len(documents),
            'top_k': top_k
        })
        
    except Exception as e:
        logger.error(f"Error computing similarity: {str(e)}")
        return jsonify({
            'error': f'Failed to compute similarity: {str(e)}'
        }), 500


@app.route('/similarity/embeddings', methods=['POST'])
def compute_similarity_from_embeddings():
    """
    Compute cosine similarity between pre-computed embeddings.
    Useful when you have cached embeddings in ChromaDB.
    
    Request body:
    {
        "query_embedding": [...],
        "document_embeddings": [[...], [...], ...],
        "top_k": 5 (optional, default: all)
    }
    
    Response:
    {
        "results": [
            {"index": 0, "score": 0.95},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'query_embedding' not in data or 'document_embeddings' not in data:
            return jsonify({
                'error': 'Missing query_embedding or document_embeddings in request body'
            }), 400
        
        query_embedding = np.array(data['query_embedding'])
        doc_embeddings = np.array(data['document_embeddings'])
        top_k = data.get('top_k', len(doc_embeddings))
        
        # Normalize embeddings for cosine similarity
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        doc_norms = doc_embeddings / np.linalg.norm(doc_embeddings, axis=1, keepdims=True)
        
        # Compute cosine similarities
        similarities = np.dot(doc_norms, query_norm)
        
        # Sort by similarity score (descending)
        sorted_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in sorted_indices:
            results.append({
                'index': int(idx),
                'score': float(similarities[idx])
            })
        
        return jsonify({
            'results': results,
            'total_documents': len(doc_embeddings),
            'top_k': top_k
        })
        
    except Exception as e:
        logger.error(f"Error computing similarity from embeddings: {str(e)}")
        return jsonify({
            'error': f'Failed to compute similarity: {str(e)}'
        }), 500


@app.route('/model/info', methods=['GET'])
def get_model_info():
    """
    Get detailed information about the loaded model.
    
    Response:
    {
        "model_name": "all-MiniLM-L6-v2",
        "embedding_dimension": 384,
        "max_seq_length": 256,
        "tokenizer_info": {...}
    }
    """
    try:
        current_model = get_model()
        
        return jsonify({
            'model_name': MODEL_NAME,
            'embedding_dimension': current_model.get_sentence_embedding_dimension(),
            'max_seq_length': current_model.max_seq_length,
            'available_models': [
                {
                    'name': 'all-MiniLM-L6-v2',
                    'dimensions': 384,
                    'description': 'Fast and good quality (default)'
                },
                {
                    'name': 'all-mpnet-base-v2',
                    'dimensions': 768,
                    'description': 'Better quality, slower'
                },
                {
                    'name': 'multi-qa-MiniLM-L6-cos-v1',
                    'dimensions': 384,
                    'description': 'Optimized for Q&A tasks'
                },
                {
                    'name': 'paraphrase-multilingual-MiniLM-L12-v2',
                    'dimensions': 384,
                    'description': 'Multilingual support'
                }
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({
            'error': f'Failed to get model info: {str(e)}'
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint with detailed status.
    
    Response:
    {
        "status": "healthy",
        "model": "model_name",
        "embedding_dimension": d,
        "model_loaded": true/false
    }
    """
    try:
        current_model = get_model()
        return jsonify({
            'status': 'healthy',
            'model': MODEL_NAME,
            'embedding_dimension': current_model.get_sentence_embedding_dimension(),
            'model_loaded': model is not None,
            'max_seq_length': current_model.max_seq_length
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'model_loaded': model is not None
        }), 500


@app.route('/find-relevant-content', methods=['POST'])
def find_relevant_content():
    """
    Find relevant content from a set of documents based on topics.
    This endpoint helps identify the most relevant curriculum content
    for generating assessment questions.
    
    Request body:
    {
        "topics": ["topic1", "topic2"],
        "documents": ["doc1 text", "doc2 text", ...],
        "top_k": 10 (optional, default: 10)
    }
    
    Response:
    {
        "relevant_content": [
            {
                "topic": "topic1",
                "documents": [
                    {"text": "...", "index": 0, "score": 0.95},
                    ...
                ]
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'topics' not in data or 'documents' not in data:
            return jsonify({
                'error': 'Missing topics or documents in request body'
            }), 400
        
        topics = data['topics']
        documents = data['documents']
        top_k = data.get('top_k', 10)
        
        if not isinstance(topics, list) or len(topics) == 0:
            return jsonify({
                'error': 'topics must be a non-empty list'
            }), 400
        
        if not isinstance(documents, list) or len(documents) == 0:
            return jsonify({
                'error': 'documents must be a non-empty list'
            }), 400
        
        current_model = get_model()
        
        # Generate embeddings for documents
        doc_embeddings = current_model.encode(documents, normalize_embeddings=True)
        
        results = []
        
        for topic in topics:
            # Generate embedding for topic
            topic_embedding = current_model.encode(topic, normalize_embeddings=True)
            
            # Compute similarities
            similarities = np.dot(doc_embeddings, topic_embedding)
            
            # Get top k indices
            sorted_indices = np.argsort(similarities)[::-1][:top_k]
            
            topic_results = []
            for idx in sorted_indices:
                if similarities[idx] > 0.3:  # Only include reasonably relevant content
                    topic_results.append({
                        'text': documents[idx],
                        'index': int(idx),
                        'score': float(similarities[idx])
                    })
            
            results.append({
                'topic': topic,
                'documents': topic_results
            })
        
        return jsonify({
            'relevant_content': results,
            'model': MODEL_NAME,
            'total_topics': len(topics),
            'total_documents': len(documents)
        })
        
    except Exception as e:
        logger.error(f"Error finding relevant content: {str(e)}")
        return jsonify({
            'error': f'Failed to find relevant content: {str(e)}'
        }), 500


@app.route('/cluster-content', methods=['POST'])
def cluster_content():
    """
    Cluster similar content together for better question generation.
    
    Request body:
    {
        "documents": ["doc1", "doc2", ...],
        "num_clusters": 5 (optional)
    }
    
    Response:
    {
        "clusters": [
            {
                "cluster_id": 0,
                "documents": [{"text": "...", "index": 0}, ...]
            }
        ]
    }
    """
    try:
        from sklearn.cluster import KMeans
        
        data = request.get_json()
        
        if not data or 'documents' not in data:
            return jsonify({
                'error': 'Missing documents in request body'
            }), 400
        
        documents = data['documents']
        num_clusters = data.get('num_clusters', min(5, len(documents)))
        
        if len(documents) < num_clusters:
            num_clusters = len(documents)
        
        current_model = get_model()
        
        # Generate embeddings
        embeddings = current_model.encode(documents, normalize_embeddings=True)
        
        # Cluster embeddings
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        # Organize results by cluster
        clusters = {}
        for idx, label in enumerate(cluster_labels):
            label = int(label)
            if label not in clusters:
                clusters[label] = []
            clusters[label].append({
                'text': documents[idx],
                'index': idx
            })
        
        return jsonify({
            'clusters': [
                {'cluster_id': cid, 'documents': docs}
                for cid, docs in sorted(clusters.items())
            ],
            'num_clusters': num_clusters,
            'total_documents': len(documents)
        })
        
    except ImportError:
        return jsonify({
            'error': 'scikit-learn is required for clustering. Install with: pip install scikit-learn'
        }), 500
    except Exception as e:
        logger.error(f"Error clustering content: {str(e)}")
        return jsonify({
            'error': f'Failed to cluster content: {str(e)}'
        }), 500


@app.route('/', methods=['GET'])
def home():
    """
    API information and available endpoints.
    """
    return jsonify({
        'message': 'Embedding API is running',
        'version': '1.0.0',
        'model': MODEL_NAME,
        'endpoints': {
            '/embed': {
                'method': 'POST',
                'description': 'Generate embeddings for a list of texts',
                'body': '{"texts": ["text1", "text2"], "normalize": true}'
            },
            '/embed/single': {
                'method': 'POST',
                'description': 'Generate embedding for a single text',
                'body': '{"text": "your text", "normalize": true}'
            },
            '/embed/batch': {
                'method': 'POST',
                'description': 'Generate embeddings for large batches with chunking',
                'body': '{"texts": [...], "batch_size": 32, "normalize": true}'
            },
            '/similarity': {
                'method': 'POST',
                'description': 'Compute similarity between query and documents',
                'body': '{"query": "...", "documents": [...], "top_k": 5}'
            },
            '/similarity/embeddings': {
                'method': 'POST',
                'description': 'Compute similarity from pre-computed embeddings',
                'body': '{"query_embedding": [...], "document_embeddings": [[...]], "top_k": 5}'
            },
            '/find-relevant-content': {
                'method': 'POST',
                'description': 'Find relevant content from documents based on topics',
                'body': '{"topics": [...], "documents": [...], "top_k": 10}'
            },
            '/cluster-content': {
                'method': 'POST',
                'description': 'Cluster similar content together',
                'body': '{"documents": [...], "num_clusters": 5}'
            },
            '/model/info': {
                'method': 'GET',
                'description': 'Get model information and available models'
            },
            '/health': {
                'method': 'GET',
                'description': 'Health check endpoint'
            }
        }
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Please check the API documentation at /'
    }), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting embedding API on port {port}")
    logger.info(f"Using model: {MODEL_NAME}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
