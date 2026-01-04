import mongoose from "mongoose";

let isConnected = false;

const connectDB = (handler) => async (req, res) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return handler(req, res);
  }

  try {
    // Validate MONGO_URI is configured
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not configured in environment variables");
      return res.status(500).json({
        type: "error",
        message: "Database configuration error. Please check server configuration.",
        errorCode: "CONFIG_ERROR",
      });
    }

    if (mongoose.connection.readyState < 1) {
      mongoose.set("strictQuery", false);
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });

      isConnected = true;
      console.log("MongoDB connected.");
    }

    return handler(req, res);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return res.status(500).json({
      type: "error",
      message: "Database connection failed.",
      error: err.message,
    });
  }
};

export default connectDB;