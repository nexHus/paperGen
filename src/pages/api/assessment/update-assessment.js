import connectDB from "@/middlewares/connectDB";
import Assessment from "@/models/Assessment";
import mongoose from "mongoose";
import { ApiResponse } from "@/utilis-Backend/apiResponse.util";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { assessmentId, ...updateData } = req.body;

      if (!assessmentId) {
        return res.status(400).json({
          type: "error",
          message: "assessmentId is required",
        });
      }

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          type: "error",
          message: "Invalid assessmentId format",
        });
      }

      // Check if assessment exists
      const existingAssessment = await Assessment.findOne({
        _id: new mongoose.Types.ObjectId(assessmentId)
      });

      if (!existingAssessment) {
        return res.status(404).json({
          type: "error",
          message: "Assessment not found or you don't have permission to update it",
        });
      }

      // Prepare update object - only include allowed fields
      const allowedFields = [
        'assessmentTitle',
        'subject',
        'assessmentType',
        'duration',
        'difficultyLevel',
        'passingPercentage',
        'numberOfQuestions',
        'marksPerQuestion',
        'topicsCovered',
        'assessmentFile'
      ];

      const sanitizedUpdate = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          sanitizedUpdate[field] = updateData[field];
        }
      }

      // Handle field name mappings from frontend
      if (updateData.title !== undefined) {
        sanitizedUpdate.assessmentTitle = updateData.title;
      }
      if (updateData.difficulty !== undefined) {
        sanitizedUpdate.difficultyLevel = updateData.difficulty;
      }
      if (updateData.topics !== undefined) {
        sanitizedUpdate.topicsCovered = Array.isArray(updateData.topics) 
          ? updateData.topics 
          : updateData.topics.split(',').map(t => t.trim());
      }

      // Calculate total marks if questions or marks are updated
      if (sanitizedUpdate.numberOfQuestions || sanitizedUpdate.marksPerQuestion) {
        const numQuestions = sanitizedUpdate.numberOfQuestions || existingAssessment.numberOfQuestions;
        const marksPerQ = sanitizedUpdate.marksPerQuestion || existingAssessment.marksPerQuestion;
        sanitizedUpdate.totalMarks = numQuestions * marksPerQ;
      }

      // Update assessment
      const updatedAssessment = await Assessment.findByIdAndUpdate(
        assessmentId,
        {
          ...sanitizedUpdate,
          updatedAt: new Date()
        },
        {
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      );

      if (!updatedAssessment) {
        return res.status(500).json(
          new ApiResponse(500, "Failure", "Failed to update assessment")
        );
      }

      return res.status(200).json({
        type: "success",
        message: "Assessment updated successfully",
        assessment: updatedAssessment
      });

    } catch (err) {
      console.error("Assessment update error:", err);
      return res.status(500).json({
        type: "error",
        message: "Something went wrong while updating assessment.",
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
