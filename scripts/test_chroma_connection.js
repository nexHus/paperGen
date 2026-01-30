
import { ChromaClient } from 'chromadb';

// Mock the FlaskEmbeddingFunction since we can't easily import it without the alias setup
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

async function testChroma() {
    console.log("Testing ChromaDB Connection...");
    const chromaUrl = "http://localhost:8000";
    const client = new ChromaClient({ path: chromaUrl });
    
    try {
        const heartbeat = await client.heartbeat();
        console.log("Connected to ChromaDB:", heartbeat);
    } catch (error) {
        console.error("Could not connect to ChromaDB:", error.message);
        return;
    }

    try {
        const collectionName = "curriculum_documents";
        const embeddingFunction = new FlaskEmbeddingFunction("http://localhost:5000");
        
        // Try to get the collection
        const collection = await client.getCollection({
            name: collectionName,
            embeddingFunction: embeddingFunction
        });
        
        console.log("Collection retrieved:", collection.name);
        
        const count = await collection.count();
        console.log("Document count in collection:", count);

        if (count > 0) {
            // Test search
            const query = "computer science";
            console.log(`Searching for "${query}"...`);
            
            const results = await collection.query({
                queryTexts: [query],
                nResults: 2
            });
            
            console.log("Search results found:", results.ids[0].length);
            if (results.documents && results.documents[0]) {
                console.log("First result snippet:", results.documents[0][0].substring(0, 100));
            }
        } else {
            console.log("Collection is empty.");
        }

    } catch (error) {
        console.error("Error accessing collection:", error);
    }
}

testChroma();
