import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { name, subject, grade, board, bookTitle, author, publisher, edition, numberOfChapters, topics, file } = req.body;

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({
                    type: "error",
                    message: "Curriculum name is required"
                });
            }

            if (!subject || !subject.trim()) {
                return res.status(400).json({
                    type: "error",
                    message: "Subject is required"
                });
            }

            if (!grade || !grade.trim()) {
                return res.status(400).json({
                    type: "error",
                    message: "Grade is required"
                });
            }

            if (!board || !board.trim()) {
                return res.status(400).json({
                    type: "error",
                    message: "Board is required"
                });
            }

            if (!bookTitle || !bookTitle.trim()) {
                return res.status(400).json({
                    type: "error",
                    message: "Book title is required"
                });
            }

            // Sanitize and prepare data
            const sanitizedTopics = Array.isArray(topics) 
                ? topics.filter(t => t && t.trim())
                : (topics ? String(topics).split(',').map(t => t.trim()).filter(t => t) : []);

            let newCurriculum = new Curriculum({
                name: name.trim(),
                subject: subject.trim(),
                grade: grade.trim(),
                board: board.trim(),
                bookTitle: bookTitle.trim(),
                author: author ? author.trim() : "Not specified",
                publisher: publisher ? publisher.trim() : "Not specified",
                edition: edition ? edition.trim() : "Latest",
                numberOfChapters: parseInt(numberOfChapters) || 0,
                topics: sanitizedTopics,
                file: file || null,
                uploadedBy: LOCAL_USER_ID
            });
            
            await newCurriculum.save();

            return res.status(200).json({
                type: "success",
                message: "Curriculum added successfully",
                curriculum: newCurriculum
            });
        } catch (err) {
            console.error("Curriculum addition error:", err);
            
            // Handle mongoose validation errors
            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(e => e.message);
                return res.status(400).json({
                    type: "error",
                    message: messages.join(', '),
                });
            }
            
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while adding curriculum.",
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
