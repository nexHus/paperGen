import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    if (req.method === "GET") {
        try {
            // Get all curriculums for local dev (or filter by LOCAL_USER_ID)
            const curriculums = await Curriculum.find({});

            return res.status(200).json({
                type: "success",
                message: "Curriculums retrieved successfully",
                curriculums
            });
        } catch (err) {
            console.error("Curriculum retrieve error:", err);
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while getting curriculums.",
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
