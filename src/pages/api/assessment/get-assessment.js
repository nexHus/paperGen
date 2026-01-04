import connectDB from "@/middlewares/connectDB";
import Assessment from "@/models/Assessment";
import mongoose from "mongoose";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    
  if (req.method === "GET") {
    try {
      // Get assessmentId from query parameters instead of body
      const { assessmentId } = req.query;

      if (!assessmentId) {
        return res.status(400).json({
          type: "error",
          message: "assessmentId is required as query parameter",
        });
      }

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          type: "error",
          message: "Invalid assessmentId format",
        });
      }

      const assessment = await Assessment.findOne({
        _id: new mongoose.Types.ObjectId(assessmentId)
      });

      if (!assessment) {
        return res.status(404).json({
          type: "error",
          message: "Assessment not found or you don't have permission to view it",
        });
      }

      return res.status(200).json({
        type: "success",
        message: "Assessment retrieved successfully",
        assessment,
      });
    } catch (err) {
      console.error("Assessment retrieve error:", err);
      return res.status(500).json({
        type: "error",
        message: "Something went wrong while getting assessment.",
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
