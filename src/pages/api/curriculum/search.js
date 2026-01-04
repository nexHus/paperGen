import ChromaDBManager from "@/utils/chromaManager";
import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";

const handler = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { query, limit = 5 } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          type: "error",
          message: "Query text is required",
          errorCode: "MISSING_QUERY",
        });
      }

      // Sanitize and validate limit
      const searchLimit = Math.min(Math.max(1, parseInt(limit) || 5), 20);

      // Try ChromaDB first for semantic search
      let chromaResults = null;
      let searchMethod = "chroma";

      try {
        const chromaManager = new ChromaDBManager();
        const isAvailable = await chromaManager.checkConnection();
        
        if (isAvailable) {
          const searchResults = await chromaManager.search(query, searchLimit);
          chromaResults = {
            query: query,
            results: searchResults.documents[0]?.map((doc, index) => ({
              text: doc,
              metadata: searchResults.metadatas[0][index],
              distance: searchResults.distances[0][index],
              id: searchResults.ids[0][index]
            })) || []
          };
        }
      } catch (chromaError) {
        console.error("ChromaDB search failed:", chromaError.message);
        searchMethod = "mongodb";
      }

      // Fallback to MongoDB text search if ChromaDB unavailable
      if (!chromaResults || chromaResults.results.length === 0) {
        console.log("Using MongoDB fallback search...");
        searchMethod = "mongodb";
        
        // Simple text search in MongoDB
        const mongoResults = await Curriculum.find({
          $or: [
            { textContent: { $regex: query, $options: 'i' } },
            { fileName: { $regex: query, $options: 'i' } },
            { topics: { $regex: query, $options: 'i' } },
          ]
        })
        .limit(searchLimit)
        .select('fileName textContent topics publicId')
        .lean();

        chromaResults = {
          query: query,
          results: mongoResults.map(doc => ({
            text: doc.textContent?.substring(0, 500) || '',
            metadata: {
              fileName: doc.fileName,
              documentId: doc.publicId,
              topics: doc.topics,
            },
            distance: null, // MongoDB doesn't provide distance scores
            id: doc._id.toString()
          }))
        };
      }

      return res.status(200).json({
        type: "success",
        message: `Search completed successfully using ${searchMethod}`,
        data: chromaResults,
        searchMethod: searchMethod,
      });

    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({
        type: "error",
        message: "Something went wrong while searching.",
        errorCode: "SEARCH_FAILED",
        error: err.message,
      });
    }
  } else {
    return res.status(405).json({
      type: "error",
      message: "Method Not Allowed.",
      errorCode: "METHOD_NOT_ALLOWED",
    });
  }
};

export default connectDB(handler);
