import mongoose, { Schema } from "mongoose";

/**
 * Question Schema - Embedded in Assessment
 * Supports MCQ, Short Answer, and Long Answer questions
 */
const questionSchema = new Schema({
  id: { type: String },
  type: { 
    type: String, 
    enum: ["MCQ", "Short Answer", "Long Answer"],
    required: true 
  },
  question: { type: String, required: true },
  options: [{ type: String }], // For MCQs
  correctAnswer: { type: Number }, // Index of correct option for MCQs
  marks: { type: Number, default: 1 },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
  topic: { type: String },
  rubric: { type: String }, // Grading rubric for short/long answers
  expectedLength: { type: String }, // Expected answer length
  sourceContent: { type: String }, // Source curriculum content used
});

/**
 * Assessment Schema
 * Stores complete assessment with questions
 */
const assessmentSchema = new Schema(
  {
    assessmentTitle: { type: String, required: true },
    subject: { type: String, required: true },
    assessmentType: { 
      type: String,
      enum: ["mcqs", "shortQuestions", "longQuestions", "fullPaper", "mixed"],
      default: "mixed"
    },
    duration: { type: Number, default: 60 }, // Duration in minutes
    difficultyLevel: { 
      type: String, 
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Medium"
    },
    passingPercentage: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 40 
    },
    numberOfQuestions: { type: Number },
    marksPerQuestion: { type: Number, default: 1 },
    totalMarks: { type: Number },
    topicsCovered: [{ type: String }],
    questions: [questionSchema], // Array of generated questions
    assessmentFile: { type: String },
    generatedAt: { type: Date },
    generationMethod: { 
      type: String, 
      enum: ["local", "huggingface", "openai-compatible"],
      default: "local"
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },
    createdBy: { type: String }, // Changed from ObjectId to String to support local dev users
  },
  {
    timestamps: true,
  }
)
// assessmentSchema.plugin(mongooseAggregatePaginate)

const Assessment = mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

export default Assessment;