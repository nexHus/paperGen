"""
Flask API for generating text embeddings
This is a sample Flask server that receives text chunks and returns embeddings
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load the embedding model (you can use different models)
# Popular options: 'all-MiniLM-L6-v2', 'all-mpnet-base-v2', 'multi-qa-MiniLM-L6-cos-v1'
MODEL_NAME = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
model = SentenceTransformer(MODEL_NAME)

@app.route('/embed', methods=['POST'])
def generate_embeddings():
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({
                'error': 'Missing texts in request body'
            }), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({
                'error': 'texts must be a non-empty list'
            }), 400
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Convert numpy arrays to lists for JSON serialization
        embeddings_list = embeddings.tolist()
        
        return jsonify({
            'embeddings': embeddings_list,
            'model': MODEL_NAME,
            'num_texts': len(texts),
            'embedding_dimension': len(embeddings_list[0]) if embeddings_list else 0
        })
        
    except Exception as e:
        print(f"Error generating embeddings: {str(e)}")
        return jsonify({
            'error': f'Failed to generate embeddings: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'embedding_dimension': model.get_sentence_embedding_dimension()
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Embedding API is running',
        'endpoints': {
            '/embed': 'POST - Generate embeddings for text chunks',
            '/health': 'GET - Health check'
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting embedding API on port {port}")
    print(f"Using model: {MODEL_NAME}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
