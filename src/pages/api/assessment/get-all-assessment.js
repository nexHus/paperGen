import connectDB from "@/middlewares/connectDB";
import Assessment from "@/models/Assessment";

// LOCAL DEV MODE - Authentication disabled
const LOCAL_USER_ID = "local_dev_user";

const handler = async (req, res) => {
    console.log("Hello before")
    if (req.method === "GET") {
        try {
            console.log("Hello after")

            // Get all assessments for local dev
            const assessment = await Assessment.find({});

            console.log(assessment)

            return res.status(200).json({
                type: "success",
                message: "Curriculums retrieved successfully",
                assessment
            });
        } catch (err) {
            console.error("assessment retrieve error:", err);
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
