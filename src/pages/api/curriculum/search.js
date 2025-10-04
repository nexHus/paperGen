import ChromaDBManager from "@/utils/chromaManager";
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

      // Search ChromaDB for similar chunks using query text
      const chromaManager = new ChromaDBManager();
      const searchResults = await chromaManager.search(query, limit);

      // Format and return results
      const formattedResults = {
        query: query,
        results: searchResults.documents[0]?.map((doc, index) => ({
          text: doc,
          metadata: searchResults.metadatas[0][index],
          distance: searchResults.distances[0][index],
          id: searchResults.ids[0][index]
        })) || []
      };

      return res.status(200).json({
        type: "success",
        message: "Search completed successfully",
        data: formattedResults,
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
