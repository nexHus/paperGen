import mongoose from 'mongoose';
const { Schema } = mongoose;

const curriculumSchema = new Schema({
  name: { type: String },
  subject: { type: String },
  grade: { type: String },
  board: { type: String },
  bookTitle: { type: String },
  author: { type: String },
  publisher: { type: String },
  edition: { type: String },
  numberOfChapters: { type: Number },
  topics: [{ type: String }],
  fileName: { type: String }, // Original filename
  fileUrl: { type: String }, // Cloudinary URL
  publicId: { type: String }, // Cloudinary public ID for deletion
  textContent: { type: String }, // Text preview
  totalChunks: { type: Number }, // Number of text chunks created
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });



mongoose.models = {}

export default mongoose.model("Curriculum", curriculumSchema);