import User from "@/models/User";
import connectDB from "@/middlewares/connectDB";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const handler = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          type: "error",
          message: "Email and password are required.",
          errorCode: "MISSING_FIELDS",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          type: "error",
          message: "No account found with this email.",
          errorCode: "USER_NOT_FOUND",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          type: "error",
          message: "Incorrect password. Please try again.",
          errorCode: "WRONG_PASSWORD",
        });
      }

      // Validate JWT_SECRET is configured
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured in environment variables");
        return res.status(500).json({
          type: "error",
          message: "Server configuration error. Please contact administrator.",
          errorCode: "CONFIG_ERROR",
        });
      }

      const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});
      const sendUser = {
        userId: user._id,
        email: user.email,
        name: user.name,
      };

      return res.status(200).json({
        type: "success",
        message: "Logged in successfully.",
        user: sendUser,
        token
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({
        type: "error",
        message: "Something went wrong during login.",
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
