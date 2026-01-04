/**
 * Database Seed Script for PaperGenie
 * 
 * This script populates the database with sample data for testing.
 * Run with: node scripts/seed-database.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/papergenie';

// Define schemas inline (to avoid import issues)
const questionSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ["MCQ", "Short Answer", "Long Answer"] },
  question: String,
  options: [String],
  correctAnswer: Number,
  marks: Number,
  difficulty: String,
  topic: String,
  rubric: String,
});

const assessmentSchema = new mongoose.Schema({
  assessmentTitle: String,
  subject: String,
  assessmentType: String,
  duration: Number,
  difficultyLevel: String,
  passingPercentage: Number,
  numberOfQuestions: Number,
  marksPerQuestion: Number,
  totalMarks: Number,
  topicsCovered: [String],
  questions: [questionSchema],
  assessmentFile: String,
  generationMethod: String,
  status: { type: String, default: 'published' },
  createdBy: String,
}, { timestamps: true });

const curriculumSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  publicId: String,
  textContent: String,
  totalChunks: Number,
  subject: String,
  grade: String,
  topics: [String],
  uploadedAt: Date,
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  password: String,
  role: { type: String, default: 'user' },
}, { timestamps: true });

// Create models
const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
const Curriculum = mongoose.models.Curriculum || mongoose.model('Curriculum', curriculumSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load sample data
    const sampleDataPath = path.join(__dirname, 'sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Assessment.deleteMany({});
    await Curriculum.deleteMany({});
    console.log('✅ Existing data cleared');

    // Seed Curriculums
    console.log('📚 Seeding curriculums...');
    const curriculumDocs = sampleData.curriculums.map((curr, index) => ({
      fileName: `${curr.title.replace(/\s+/g, '_')}.pdf`,
      fileUrl: `https://example.com/sample/${index + 1}.pdf`,
      publicId: `curriculum_sample_${index + 1}`,
      textContent: curr.content,
      totalChunks: Math.ceil(curr.content.length / 1000),
      subject: curr.subject,
      topics: curr.content.match(/\d+\.\s+([^:]+):/g)?.map(t => t.replace(/\d+\.\s+|:/g, '').trim()) || [],
      uploadedAt: new Date(),
    }));

    await Curriculum.insertMany(curriculumDocs);
    console.log(`✅ Seeded ${curriculumDocs.length} curriculums`);

    // Seed Sample Assessments
    console.log('📝 Seeding assessments...');
    
    const csQuestions = sampleData.sampleQuestions.computerScience.map((q, i) => ({
      id: `cs_q_${i + 1}`,
      ...q,
    }));

    const webDevQuestions = sampleData.sampleQuestions.webDevelopment.map((q, i) => ({
      id: `web_q_${i + 1}`,
      ...q,
    }));

    const assessments = [
      {
        assessmentTitle: 'Computer Science Fundamentals Quiz',
        subject: 'Computer Science',
        assessmentType: 'mixed',
        duration: 30,
        difficultyLevel: 'Medium',
        passingPercentage: 40,
        numberOfQuestions: csQuestions.length,
        marksPerQuestion: 2,
        totalMarks: csQuestions.reduce((sum, q) => sum + q.marks, 0),
        topicsCovered: ['Data Structures', 'Object-Oriented Programming', 'Programming Languages', 'Algorithms'],
        questions: csQuestions,
        assessmentFile: 'assessment_cs_sample.json',
        generationMethod: 'local',
        status: 'published',
        createdBy: 'local_dev_user',
      },
      {
        assessmentTitle: 'Web Development Basics Test',
        subject: 'Web Development',
        assessmentType: 'mixed',
        duration: 45,
        difficultyLevel: 'Medium',
        passingPercentage: 40,
        numberOfQuestions: webDevQuestions.length,
        marksPerQuestion: 2,
        totalMarks: webDevQuestions.reduce((sum, q) => sum + q.marks, 0),
        topicsCovered: ['HTML', 'CSS', 'React.js', 'Node.js'],
        questions: webDevQuestions,
        assessmentFile: 'assessment_web_sample.json',
        generationMethod: 'local',
        status: 'published',
        createdBy: 'local_dev_user',
      },
    ];

    await Assessment.insertMany(assessments);
    console.log(`✅ Seeded ${assessments.length} assessments`);

    // Create a sample user (password: password123)
    console.log('👤 Creating sample user...');
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('password123', 10);
    
    await User.findOneAndUpdate(
      { email: 'demo@papergenie.com' },
      {
        email: 'demo@papergenie.com',
        name: 'Demo User',
        password: hashedPassword,
        role: 'user',
      },
      { upsert: true, new: true }
    );
    console.log('✅ Sample user created (email: demo@papergenie.com, password: password123)');

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  📚 Curriculums: ${curriculumDocs.length}`);
    console.log(`  📝 Assessments: ${assessments.length}`);
    console.log(`  👤 Sample User: demo@papergenie.com / password123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
