import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

/**
 * ChromaDB utility class for managing document embeddings
 */
class ChromaDBManager {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_DB_URL || "http://localhost:8000"
    });
    this.collectionName = process.env.CHROMA_COLLECTION_NAME || "curriculum_documents";
    this.embeddingFunction = new DefaultEmbeddingFunction();
  }

  /**
   * Get or create collection
   */
  async getCollection() {
    try {
      // Try to get existing collection
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction
      });
      return collection;
    } catch (error) {
      // Create collection if it doesn't exist
      return await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: "Curriculum document embeddings"
        },
        embeddingFunction: this.embeddingFunction
      });
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
   * @returns {Promise<Object>} Search results
   */
  async search(queryText, nResults = 5) {
    try {
      const collection = await this.getCollection();
      
      const results = await collection.query({
        queryTexts: [queryText],
        nResults: nResults
      });

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
