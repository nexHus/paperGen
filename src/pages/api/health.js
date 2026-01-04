/**
 * Health Check API Endpoint
 * Returns the status of all services
 */

import connectDB from "@/middlewares/connectDB";
import mongoose from "mongoose";

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      api: { status: "ok" },
      mongodb: { status: "unknown" },
      chromadb: { status: "unknown" },
      flask: { status: "unknown" },
    },
    environment: process.env.NODE_ENV || "development",
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = { status: "ok", message: "Connected" };
    } else {
      health.services.mongodb = { status: "error", message: "Not connected" };
      health.status = "degraded";
    }
  } catch (error) {
    health.services.mongodb = { status: "error", message: error.message };
    health.status = "degraded";
  }

  // Check ChromaDB
  try {
    const chromaUrl = process.env.CHROMA_DB_URL || "http://localhost:8000";
    const chromaResponse = await fetch(`${chromaUrl}/api/v2/heartbeat`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (chromaResponse.ok) {
      health.services.chromadb = { status: "ok", url: chromaUrl };
    } else {
      health.services.chromadb = { status: "error", message: "Not responding" };
      health.status = "degraded";
    }
  } catch (error) {
    health.services.chromadb = { 
      status: "error", 
      message: "Connection failed - ensure ChromaDB is running" 
    };
    health.status = "degraded";
  }

  // Check Flask Embedding API
  try {
    const flaskUrl = process.env.FLASK_EMBEDDING_API_URL || "http://localhost:5000";
    const flaskResponse = await fetch(`${flaskUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (flaskResponse.ok) {
      const flaskData = await flaskResponse.json();
      health.services.flask = { 
        status: "ok", 
        url: flaskUrl,
        model: flaskData.model || "unknown"
      };
    } else {
      health.services.flask = { status: "error", message: "Not responding" };
      health.status = "degraded";
    }
  } catch (error) {
    health.services.flask = { 
      status: "error", 
      message: "Connection failed - ensure Flask API is running" 
    };
    health.status = "degraded";
  }

  // Check AI API configuration
  const hasGroq = !!process.env.OPENAI_COMPATIBLE_KEY;
  const hasHuggingFace = !!process.env.HUGGINGFACE_API_KEY;
  
  health.services.ai = {
    status: hasGroq || hasHuggingFace ? "ok" : "warning",
    groq: hasGroq ? "configured" : "not configured",
    huggingface: hasHuggingFace ? "configured" : "not configured",
    message: hasGroq || hasHuggingFace 
      ? "AI API configured" 
      : "No AI API configured - using local question generation"
  };

  const statusCode = health.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(health);
};

export default connectDB(handler);
