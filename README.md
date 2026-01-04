# 📄 PaperGenie

**AI-Powered Document Management and Assessment Platform**

PaperGenie is a comprehensive platform for educators and students that enables curriculum management and automatic AI-powered quiz generation from uploaded content.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 📚 **Curriculum Management**: Upload, organize, and manage PDF curriculum documents
- 🤖 **AI Quiz Generation**: Automatically generate quizzes from curriculum content using AI
- 📝 **Multiple Question Types**: MCQs, Short Answer, Long Answer, and Mixed assessments
- 🔍 **Semantic Search**: Find relevant content across all uploaded documents
- 📊 **Assessment Dashboard**: View, edit, and manage all created assessments
- 🔐 **User Authentication**: Secure login and signup with JWT tokens
- 💾 **Persistent Storage**: MongoDB for data, ChromaDB for vector embeddings

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                    React Components + Pages                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│         /api/assessment  /api/curriculum  /api/auth              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│    MongoDB       │ │   ChromaDB   │ │   Flask API      │
│  (Data Storage)  │ │  (Vectors)   │ │  (Embeddings)    │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** (local or MongoDB Atlas free tier)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/PaperGenie.git
cd PaperGenie
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for Flask API
cd flask_embedding_api
python -m venv embedding_env

# Activate virtual environment
# Windows:
embedding_env\Scripts\activate
# macOS/Linux:
source embedding_env/bin/activate

pip install -r requirements.txt
cd ..
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# MongoDB Configuration
# Option 1: MongoDB Atlas (free tier) - https://cloud.mongodb.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/papergenie

# Option 2: Local MongoDB
# MONGO_URI=mongodb://localhost:27017/papergenie

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary Configuration (for PDF storage)
# Sign up at https://cloudinary.com (free tier)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ChromaDB Configuration
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=curriculum_documents

# Flask Embedding API
FLASK_EMBEDDING_API_URL=http://localhost:5000

# AI API Configuration (Choose one - all have free tiers)

# Option 1: Groq (Recommended - Free & Fast)
# Sign up at https://console.groq.com
OPENAI_COMPATIBLE_URL=https://api.groq.com/openai/v1/chat/completions
OPENAI_COMPATIBLE_KEY=gsk_your_groq_api_key
OPENAI_COMPATIBLE_MODEL=llama-3.1-70b-versatile

# Option 2: HuggingFace (Free)
# HUGGINGFACE_API_KEY=hf_your_api_key

# Option 3: Together AI (Free tier)
# OPENAI_COMPATIBLE_URL=https://api.together.xyz/v1/chat/completions
# OPENAI_COMPATIBLE_KEY=your_together_key
# OPENAI_COMPATIBLE_MODEL=meta-llama/Llama-3-70b-chat-hf
```

### 4. Start the Services

You need to run 3 services:

**Terminal 1: ChromaDB (Vector Database)**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**Terminal 2: Flask Embedding API**
```bash
cd flask_embedding_api
embedding_env\Scripts\activate  # Windows
# source embedding_env/bin/activate  # macOS/Linux
python app.py
```

**Terminal 3: Next.js Application**
```bash
npm run dev
```

### 5. Seed Sample Data (Optional)

```bash
node scripts/seed-database.mjs
```

This creates:
- 3 sample curriculum documents
- 2 sample assessments with questions
- Demo user: `demo@papergenie.com` / `password123`

### 6. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Uploading Curriculum

1. Go to **Dashboard** → **Curriculum Manager**
2. Click **Upload PDF**
3. Select your PDF file (max 10MB)
4. The system will automatically:
   - Extract text from the PDF
   - Create text chunks
   - Store in ChromaDB for semantic search
   - Save metadata to MongoDB

### Generating Assessments

1. Go to **Dashboard** → **Generate Assessment**
2. Fill in the assessment details:
   - Title, Subject, Duration
   - Assessment Type (MCQs, Short Answer, Long Answer, Mixed)
   - Difficulty Level
   - Topics (comma-separated)
   - Number of Questions
3. Click **Generate**
4. The AI will:
   - Search ChromaDB for relevant curriculum content
   - Generate questions using the configured AI API
   - Save the assessment to MongoDB

### Viewing Assessments

1. Go to **Dashboard** → **My Assessments**
2. View all created assessments
3. Click on an assessment to see details and questions
4. Edit or delete assessments as needed

## 🔧 API Reference

### Assessment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/get-all-assessment` | Get all assessments |
| GET | `/api/assessment/get-assessment?assessmentId=xxx` | Get single assessment |
| POST | `/api/assessment/add-assessment` | Create new assessment |
| POST | `/api/assessment/generate-ai-questions` | Generate AI questions |
| POST | `/api/assessment/update-assessment` | Update assessment |
| POST | `/api/assessment/delete-assessment` | Delete assessment |

### Curriculum Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/curriculum/get-curriculums` | Get all curriculums |
| POST | `/api/curriculum/uploadFile` | Upload PDF curriculum |
| POST | `/api/curriculum/search` | Semantic search |
| POST | `/api/curriculum/delete-curriculum` | Delete curriculum |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Login and get token |

## 📁 Project Structure

```
PaperGenie/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup page
│   ├── components/             # React components
│   │   ├── ui/                 # UI components (shadcn)
│   │   └── ...                 # Feature components
│   ├── models/                 # MongoDB models
│   ├── pages/api/              # API routes
│   │   ├── assessment/         # Assessment APIs
│   │   ├── curriculum/         # Curriculum APIs
│   │   └── auth/               # Auth APIs
│   ├── utils/                  # Utility functions
│   └── middlewares/            # Express middlewares
├── flask_embedding_api/        # Python Flask API
│   ├── app.py                  # Main Flask application
│   └── requirements.txt        # Python dependencies
├── scripts/                    # Utility scripts
│   ├── seed-database.mjs       # Database seeder
│   ├── sample-data.json        # Sample data
│   └── export_codebase.py      # Codebase exporter
└── docs/                       # Documentation
```

## 🔌 Free API Options

PaperGenie works with several free AI APIs:

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| **Groq** | 14K tokens/min | Fast inference, recommended |
| **HuggingFace** | Rate limited | Basic usage |
| **Together AI** | $25 free credit | High-quality models |
| **OpenRouter** | Free models | Variety of models |

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
MongoServerSelectionError: connection refused
```
→ Ensure MongoDB is running or check your Atlas connection string

**ChromaDB Connection Error**
```
Error connecting to ChromaDB
```
→ Start ChromaDB with `chroma run --host localhost --port 8000`

**PDF Upload Fails**
```
Could not extract text from PDF
```
→ Ensure the PDF contains selectable text (not scanned images)

**AI Generation Returns Empty**
```
No questions generated
```
→ Check your AI API key is configured correctly in `.env.local`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [SentenceTransformers](https://www.sbert.net/) - Embeddings
- [MongoDB](https://www.mongodb.com/) - Database
