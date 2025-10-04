import Curriculum from "@/models/Curriculum";
import connectDB from "@/middlewares/connectDB";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import { chunkText, cleanText } from "@/utils/textChunker";
import ChromaDBManager from "@/utils/chromaManager";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable default body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    let uploadedFile = null; // Declare file variable at the top scope
    
    try {
      const token = req.headers.authorization?.split(" ")[1];
      
      // Uncomment these lines if you want authentication
      // if (!token) {
      //     return res.status(401).json({
      //         type: "error",
      //         message: "Unauthorized"
      //     });
      // }
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // if (!decoded) {
      //     return res.status(401).json({
      //         type: "error",
      //         message: "Invalid token"
      //     });
      // }

      // Parse the multipart form data
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
        allowEmptyFiles: false,
        filter: ({ mimetype }) => {
          return mimetype && (mimetype.includes("pdf") || mimetype === "application/pdf");
        },
      });

      const [fields, files] = await form.parse(req);
      
      console.log("Parsed files:", Object.keys(files));
      
      // Check for file in different possible field names
      const possibleFieldNames = ['file', 'pdf', 'document', 'curriculum'];
      
      for (const fieldName of possibleFieldNames) {
        if (files[fieldName] && files[fieldName].length > 0) {
          uploadedFile = files[fieldName][0];
          break;
        }
      }
      
      // If no file found in expected fields, check all files
      if (!uploadedFile) {
        const allFiles = Object.values(files).flat();
        if (allFiles.length > 0) {
          uploadedFile = allFiles[0];
        }
      }
      
      if (!uploadedFile) {
        return res.status(400).json({
          type: "error",
          message: "No file uploaded or invalid file type. Please upload a PDF file.",
          errorCode: "NO_FILE_UPLOADED",
          debug: {
            receivedFields: Object.keys(fields),
            receivedFiles: Object.keys(files),
          }
        });
      }

      // Step 1: Parse PDF to extract text
      console.log("Extracting text from PDF...");
      const pdfBuffer = fs.readFileSync(uploadedFile.filepath);
      const pdfData = await pdfParse(pdfBuffer);
      const rawText = pdfData.text;
      
      if (!rawText || rawText.trim().length === 0) {
        fs.unlinkSync(uploadedFile.filepath); // Clean up
        return res.status(400).json({
          type: "error",
          message: "Could not extract text from PDF. The file might be image-based or corrupted.",
          errorCode: "PDF_PARSE_FAILED",
        });
      }

      // Step 2: Clean and chunk the text
      console.log("Cleaning and chunking text...");
      const cleanedText = cleanText(rawText);
      const chunks = chunkText(cleanedText, 1000, 200); // 1000 chars per chunk, 200 char overlap
      
      if (chunks.length === 0) {
        fs.unlinkSync(uploadedFile.filepath); // Clean up
        return res.status(400).json({
          type: "error",
          message: "No meaningful text content found in the PDF.",
          errorCode: "NO_TEXT_CONTENT",
        });
      }

      // Step 3: Upload to Cloudinary
      console.log("Uploading to Cloudinary...");
      const cloudinaryResult = await cloudinary.uploader.upload(uploadedFile.filepath, {
        resource_type: "raw",
        folder: "curriculum_pdfs",
        public_id: `curriculum_${Date.now()}`,
        format: "pdf",
      });

      // Step 4: Save documents to ChromaDB (ChromaDB will generate embeddings automatically)
      console.log("Saving documents to ChromaDB...");
      const chromaManager = new ChromaDBManager();
      const documentId = cloudinaryResult.public_id;
      
      await chromaManager.addDocuments(chunks, {
        documentId: documentId,
        fileName: uploadedFile.originalFilename,
        uploadedAt: new Date().toISOString(),
      });

      // Step 5: Save curriculum info to database
      const curriculumData = {
        fileName: uploadedFile.originalFilename,
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        textContent: cleanedText.substring(0, 2000), // Store first 2000 chars as preview
        totalChunks: chunks.length,
        uploadedAt: new Date(),
        // Add user ID if authentication is enabled
        // userId: decoded.id,
      };

      const curriculum = new Curriculum(curriculumData);
      await curriculum.save();

      // Clean up temporary file
      fs.unlinkSync(uploadedFile.filepath);

      return res.status(200).json({
        type: "success",
        message: "File uploaded, processed, and embeddings saved successfully",
        data: {
          fileUrl: cloudinaryResult.secure_url,
          fileName: uploadedFile.originalFilename,
          publicId: cloudinaryResult.public_id,
          documentId: documentId,
          totalChunks: chunks.length,
          textPreview: cleanedText.substring(0, 500) + "...",
        },
      });

    } catch (err) {
      console.error("File upload and processing error:", err);
      
      // Clean up temporary file if it exists
      if (uploadedFile && uploadedFile.filepath && fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      
      return res.status(500).json({
        type: "error",
        message: "Something went wrong while processing the file.",
        errorCode: "PROCESSING_FAILED",
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
