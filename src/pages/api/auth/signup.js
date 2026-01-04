
import User from "@/models/User"
import connectDB from "@/middlewares/connectDB";
import bcrypt from "bcryptjs";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ type: "error", message: "Method not allowed" });
  }

  try {
    const { email, name, password } = req.body;

    // Validate required fields
    if (!email || !name || !password) {
      return res.status(400).json({ type: "error", message: "Missing required fields: email, name, and password are required." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ type: "error", message: "Invalid email format.", errorCode: "INVALID_EMAIL" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ type: "error", message: "Password must be at least 6 characters long.", errorCode: "WEAK_PASSWORD" });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({ type: "error", message: "Name must be at least 2 characters long.", errorCode: "INVALID_NAME" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        type: "error",
        message: "Email already exists. Please use a different email.",
        errorCode: "EMAIL_EXISTS",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({ type: "success", message: "Account created successfully." });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        type: "error",
        message: "Email already exists. Please use a different email.",
        errorCode: "EMAIL_EXISTS",
      });
    }

    console.error("Signup error:", err);
    return res.status(500).json({
      type: "error",
      message: "Server error occurred.",
      error: err.message,
    });
  }
};


export default connectDB(handler); 