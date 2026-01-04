import connectDB from "@/middlewares/connectDB";
import ChromaDBManager from "@/utils/chromaManager";

const FLASK_API_URL = process.env.FLASK_EMBEDDING_API_URL || 'http://localhost:5000';

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { 
        topics, 
        numberOfQuestions = 10, 
        assessmentType = 'mixed',
        difficulty = 'Medium',
        limit = 20 
      } = req.body;

      if (!topics || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({
          type: "error",
          message: "topics array is required",
        });
      }

      // Search ChromaDB for relevant content based on topics
      const chromaManager = new ChromaDBManager();
      const relevantContent = [];

      for (const topic of topics) {
        try {
          const searchResults = await chromaManager.search(topic, Math.ceil(limit / topics.length));
          
          if (searchResults.documents && searchResults.documents[0]) {
            searchResults.documents[0].forEach((doc, index) => {
              relevantContent.push({
                text: doc,
                topic: topic,
                metadata: searchResults.metadatas?.[0]?.[index] || {},
                score: searchResults.distances?.[0]?.[index] || 0
              });
            });
          }
        } catch (searchError) {
          console.error(`Error searching for topic "${topic}":`, searchError);
        }
      }

      if (relevantContent.length === 0) {
        return res.status(404).json({
          type: "error",
          message: "No relevant curriculum content found for the specified topics. Please upload relevant PDFs first.",
        });
      }

      // Use Flask API to find the most relevant content and cluster it
      let clusteredContent = [];
      try {
        const documents = relevantContent.map(c => c.text);
        
        // Get clustered content from Flask API
        const clusterResponse = await fetch(`${FLASK_API_URL}/cluster-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: documents,
            num_clusters: Math.min(topics.length, documents.length)
          })
        });

        if (clusterResponse.ok) {
          const clusterData = await clusterResponse.json();
          clusteredContent = clusterData.clusters || [];
        }
      } catch (flaskError) {
        console.error('Error calling Flask API:', flaskError);
        // Continue without clustering if Flask API fails
      }

      // Prepare response with relevant content for question generation
      const contentForQuestions = {
        topics: topics,
        assessmentType: assessmentType,
        difficulty: difficulty,
        numberOfQuestions: numberOfQuestions,
        relevantContent: relevantContent.slice(0, limit),
        clusters: clusteredContent,
        contentSummary: {
          totalDocuments: relevantContent.length,
          topicsFound: [...new Set(relevantContent.map(c => c.topic))],
          sourceFiles: [...new Set(relevantContent.map(c => c.metadata?.fileName).filter(Boolean))]
        }
      };

      // Generate question templates based on assessment type
      const questionTemplates = generateQuestionTemplates(
        assessmentType, 
        numberOfQuestions, 
        difficulty,
        relevantContent
      );

      return res.status(200).json({
        type: "success",
        message: "Relevant content retrieved successfully for question generation",
        data: {
          ...contentForQuestions,
          questionTemplates: questionTemplates
        }
      });

    } catch (err) {
      console.error("Generate questions error:", err);
      return res.status(500).json({
        type: "error",
        message: "Something went wrong while generating questions.",
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

/**
 * Generate question templates based on assessment type and content
 */
function generateQuestionTemplates(assessmentType, numberOfQuestions, difficulty, content) {
  const templates = [];
  
  const questionTypes = {
    'mcqs': { type: 'MCQ', count: numberOfQuestions },
    'shortQuestions': { type: 'Short Answer', count: numberOfQuestions },
    'longQuestions': { type: 'Long Answer', count: numberOfQuestions },
    'fullPaper': {
      sections: [
        { type: 'MCQ', count: Math.ceil(numberOfQuestions * 0.4) },
        { type: 'Short Answer', count: Math.ceil(numberOfQuestions * 0.35) },
        { type: 'Long Answer', count: Math.ceil(numberOfQuestions * 0.25) }
      ]
    },
    'mixed': {
      sections: [
        { type: 'MCQ', count: Math.ceil(numberOfQuestions * 0.5) },
        { type: 'Short Answer', count: Math.ceil(numberOfQuestions * 0.5) }
      ]
    }
  };

  const typeConfig = questionTypes[assessmentType] || questionTypes['mixed'];
  
  if (typeConfig.sections) {
    // Multi-section assessment
    typeConfig.sections.forEach(section => {
      for (let i = 0; i < section.count; i++) {
        const randomContent = content[Math.floor(Math.random() * content.length)];
        templates.push({
          questionType: section.type,
          difficulty: difficulty,
          topic: randomContent?.topic || 'General',
          sourceContent: randomContent?.text?.substring(0, 500) || '',
          placeholder: `[${section.type} question based on: "${randomContent?.topic || 'topic'}"]`
        });
      }
    });
  } else {
    // Single type assessment
    for (let i = 0; i < typeConfig.count; i++) {
      const randomContent = content[Math.floor(Math.random() * content.length)];
      templates.push({
        questionType: typeConfig.type,
        difficulty: difficulty,
        topic: randomContent?.topic || 'General',
        sourceContent: randomContent?.text?.substring(0, 500) || '',
        placeholder: `[${typeConfig.type} question based on: "${randomContent?.topic || 'topic'}"]`
      });
    }
  }

  return templates;
}

export default connectDB(handler);
