import { ChromaClient } from 'chromadb';

// Custom embedding function that uses our Flask API
class FlaskEmbeddingFunction {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || "http://localhost:5000";
  }

  async generate(texts) {
    try {
      const response = await fetch(`${this.apiUrl}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts: texts }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
}

/**
 * ChromaDB utility class for managing document embeddings
 * Includes graceful error handling when ChromaDB is unavailable
 */
class ChromaDBManager {
  constructor() {
    this.chromaUrl = process.env.CHROMA_DB_URL || "http://localhost:8000";
    this.client = new ChromaClient({
      path: this.chromaUrl
    });
    this.collectionName = process.env.CHROMA_COLLECTION_NAME || "curriculum_documents";
    
    // Use Flask API for embeddings
    const flaskApiUrl = process.env.FLASK_EMBEDDING_API_URL || "http://localhost:5000";
    this.embeddingFunction = new FlaskEmbeddingFunction(flaskApiUrl);
    
    this.isConnected = null; // null = unknown, true = connected, false = not connected
  }

  /**
   * Check if ChromaDB is available
   */
  async checkConnection() {
    if (this.isConnected !== null) return this.isConnected;
    
    try {
      await this.client.heartbeat();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.warn(`ChromaDB not available at ${this.chromaUrl}:`, error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get or create collection
   * @throws {Error} If ChromaDB is not available
   */
  async getCollection() {
    // Check connection first
    const isAvailable = await this.checkConnection();
    if (!isAvailable) {
      throw new Error(`ChromaDB is not available at ${this.chromaUrl}. Please ensure ChromaDB is running.`);
    }

    try {
      // Try to get existing collection
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          description: "Curriculum document embeddings"
        },
        embeddingFunction: this.embeddingFunction
      });
      return collection;
    } catch (error) {
      console.error('Error getting/creating ChromaDB collection:', error);
      throw error;
    }
  }

  /**
   * Add documents to ChromaDB (ChromaDB will generate embeddings automatically)
   * @param {Array<string>} chunks - Text chunks
   * @param {Object} metadata - Document metadata
   * @returns {Promise<boolean>} Success status
   */
  async addDocuments(chunks, metadata) {
    try {
      const collection = await this.getCollection();
      
      // Generate unique IDs for each chunk
      const ids = chunks.map((_, index) => 
        `${metadata.documentId}_chunk_${index}_${Date.now()}`
      );

      // Prepare metadatas for each chunk
      const metadatas = chunks.map((chunk, index) => ({
        documentId: metadata.documentId,
        fileName: metadata.fileName,
        chunkIndex: index,
        chunkText: chunk.substring(0, 100) + '...', // Preview
        uploadedAt: metadata.uploadedAt,
        totalChunks: chunks.length
      }));

      // Add documents - ChromaDB will generate embeddings automatically
      await collection.add({
        ids: ids,
        documents: chunks,
        metadatas: metadatas
      });

      console.log(`Successfully added ${chunks.length} chunks to ChromaDB`);
      return true;
    } catch (error) {
      console.error('Error adding documents to ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents using query text
   * @param {string} queryText - Query text to search for
   * @param {number} nResults - Number of results to return
   * @param {Object} where - Optional filter object (e.g., { documentId: "123" })
   * @returns {Promise<Object>} Search results
   */
  async search(queryText, nResults = 5, where = null) {
    try {
      const collection = await this.getCollection();
      
      const queryOptions = {
        queryTexts: [queryText],
        nResults: nResults
      };

      if (where) {
        queryOptions.where = where;
      }
      
      const results = await collection.query(queryOptions);

      return results;
    } catch (error) {
      console.error('Error searching ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Delete document embeddings
   * @param {string} documentId - Document ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(documentId) {
    try {
      const collection = await this.getCollection();
      
      await collection.delete({
        where: { documentId: documentId }
      });

      console.log(`Successfully deleted document ${documentId} from ChromaDB`);
      return true;
    } catch (error) {
      console.error('Error deleting document from ChromaDB:', error);
      throw error;
    }
  }
}

export default ChromaDBManager;
