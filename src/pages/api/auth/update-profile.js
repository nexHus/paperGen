import User from "@/models/User";
import connectDB from "@/middlewares/connectDB";
import verifyJWT from "@/middlewares/verifyJWT.middleware";

const handler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ type: "error", message: "Method not allowed" });
  }

  try {
    const { name, bio } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        type: "error", 
        message: "Name must be at least 2 characters long." 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name: name.trim(),
        bio: bio ? bio.trim() : ""
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ 
        type: "error", 
        message: "User not found." 
      });
    }

    return res.status(200).json({
      type: "success",
      message: "Profile updated successfully.",
      user: updatedUser
    });

  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      type: "error",
      message: "Server error occurred.",
      error: err.message,
    });
  }
};

export default connectDB(verifyJWT(handler));
