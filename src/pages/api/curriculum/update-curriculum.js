import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";
import mongoose from "mongoose";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { curriculumId, ...updateData } = req.body;

            if (!curriculumId) {
                return res.status(400).json({
                    type: "error",
                    message: "Curriculum ID is required"
                });
            }

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
                return res.status(400).json({
                    type: "error",
                    message: "Invalid curriculum ID format"
                });
            }

            // Check if curriculum exists
            const existingCurriculum = await Curriculum.findOne({
                _id: curriculumId
            });

            if (!existingCurriculum) {
                return res.status(404).json({
                    type: "error",
                    message: "Curriculum not found or you don't have permission to update it"
                });
            }

            // Update curriculum with new data
            const updatedCurriculum = await Curriculum.findByIdAndUpdate(
                curriculumId,
                {
                    ...updateData,
                    updatedAt: new Date()
                },
                { 
                    new: true, // Return the updated document
                    runValidators: true // Run schema validators
                }
            );

            return res.status(200).json({
                type: "success",
                message: "Curriculum updated successfully",
                curriculum: updatedCurriculum
            });

        } catch (err) {
            console.error("Curriculum update error:", err);
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while updating curriculum.",
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