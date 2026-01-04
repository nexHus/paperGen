import Assessment from "@/models/Assessment";
import connectDB from "@/middlewares/connectDB";
import { ApiResponse } from "@/utilis-Backend/apiResponse.util.js";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json(new ApiResponse(405, "Method Not Allowed - Request must be POST"));
  }
  try {
    if (!req.body)
      return res.status(500).json(new ApiResponse(500, "Req. Body not found"));

    // Debug logging
    // console.log("Request method:", req.method);
    // console.log("Content-Type:", req.headers['content-type']);
    // console.log("Request body:", req.body);
    // console.log("Body keys:", Object.keys(req.body || {}));

    const {
      title,
      subject,
      assessmentType,
      duration,
      difficultyLevel,
      passingPercentage,
      numberOfQuestions,
      marksPerQuestion,
      topicsCovered,
      assessmentFile,
    } = req.body;

    console.log(title);
    const assessmentTitle = title;

    // Validate required fields
    if (!title || !subject || !assessmentType) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "Error",
            "Missing required fields: assessmentTitle, subject, assessmentType"
          )
        );
    }

    console.log("Assessment data received:", {
      assessmentTitle,
      subject,
      assessmentType,
      duration,
      difficultyLevel,
      passingPercentage,
      numberOfQuestions,
      marksPerQuestion,
      topicsCovered,
    });

    // Create new assessment
    const newAssessment = new Assessment({
      assessmentTitle,
      subject,
      assessmentType,
      duration: parseInt(duration),
      difficulty: difficultyLevel,
      passingPercentage: parseInt(passingPercentage),
      numberOfQuestions: parseInt(numberOfQuestions),
      marksPerQuestion: parseInt(marksPerQuestion),
      totalMarks: parseInt(numberOfQuestions) * parseInt(marksPerQuestion),
      topicsCovered: Array.isArray(topicsCovered)
        ? topicsCovered
        : topicsCovered
        ? String(topicsCovered)
            .split(",")
            .map((t) => t.trim())
        : [],
      assessmentFile,
      createdBy: LOCAL_USER_ID,
    });

    const savedAssessment = await newAssessment.save();
    if (!savedAssessment)
      return res
        .status(200)
        .json(
          new ApiResponse(
            500,
            "Failur",
            "Assessment not saved to Db",
            savedAssessment
          )
        );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Success",
          "Assessment created successfully",
          savedAssessment
        )
      );
  } catch (error) {
    console.log("Error creating assessment:", error);
    return res.status(500).json(new ApiResponse(500, error.message));
  }
};

export default connectDB(handler);
