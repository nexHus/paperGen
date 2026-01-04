import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";
import { v2 as cloudinary } from "cloudinary";
import ChromaDBManager from "@/utils/chromaManager";
import mongoose from "mongoose";

// Configure Cloudinary only if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { curriculumId } = req.body;

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
                    message: "Curriculum not found or you don't have permission to delete it"
                });
            }

            // Delete from ChromaDB if publicId exists (for uploaded PDFs)
            if (existingCurriculum.publicId) {
                try {
                    const chromaManager = new ChromaDBManager();
                    const isConnected = await chromaManager.checkConnection();
                    if (isConnected) {
                        await chromaManager.deleteDocument(existingCurriculum.publicId);
                        console.log(`Deleted embeddings for document: ${existingCurriculum.publicId}`);
                    } else {
                        console.log('ChromaDB not available, skipping embedding deletion');
                    }
                } catch (chromaError) {
                    console.error('Error deleting from ChromaDB:', chromaError);
                    // Continue with deletion even if ChromaDB fails
                }

                // Delete from Cloudinary only if configured
                if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
                    try {
                        await cloudinary.uploader.destroy(existingCurriculum.publicId, {
                            resource_type: "raw"
                        });
                        console.log(`Deleted file from Cloudinary: ${existingCurriculum.publicId}`);
                    } catch (cloudinaryError) {
                        console.error('Error deleting from Cloudinary:', cloudinaryError);
                        // Continue with deletion even if Cloudinary fails
                    }
                }
            }

            // Delete the curriculum from MongoDB
            await Curriculum.findByIdAndDelete(curriculumId);

            return res.status(200).json({
                type: "success",
                message: "Curriculum and associated data deleted successfully",
            });

        } catch (err) {
            console.error("Curriculum delete error:", err);
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while deleting curriculum.",
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