import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from "cloudinary";





const handler = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { name, subject, grade, board, bookTitle, author, publisher, edition, numberOfChapters, topics, file } = req.body;
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    type: "error",
                    message: "Unauthorized"
                });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(401).json({
                    type: "error",
                    message: "Invalid token"
                });
            }


            let newCurriculum = new Curriculum({
                name, subject, grade, board, bookTitle, author, publisher, edition, numberOfChapters, topics, file,uploadedBy:decoded.userId
            })
            await newCurriculum.save();

            return res.status(200).json({
                type: "success",
                message: "Curriculum added successfully",
                curriculum: newCurriculum
            });
        } catch (err) {
            console.error("Curriculum addition error:", err);
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while adding curriculum.",
                errorCode: "LOGIN_FAILED",
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
