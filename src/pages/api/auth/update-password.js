import User from "@/models/User";
import connectDB from "@/middlewares/connectDB";
import verifyJWT from "@/middlewares/verifyJWT.middleware";
import bcrypt from "bcryptjs";

const handler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ type: "error", message: "Method not allowed" });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        type: "error", 
        message: "Both current and new passwords are required." 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        type: "error", 
        message: "New password must be at least 6 characters long." 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        type: "error", 
        message: "User not found." 
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        type: "error", 
        message: "Incorrect current password." 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      type: "success",
      message: "Password updated successfully."
    });

  } catch (err) {
    console.error("Update password error:", err);
    return res.status(500).json({
      type: "error",
      message: "Server error occurred.",
      error: err.message,
    });
  }
};

export default connectDB(verifyJWT(handler));
