#!/bin/bash
# PaperGenie Development Startup Script for macOS/Linux
# This script starts all required services for local development

echo "==================================="
echo "  PaperGenie Development Setup"
echo "==================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python from https://python.org"
    exit 1
fi

echo "[INFO] Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "[INFO] Shutting down services..."
    kill $CHROMA_PID $FLASK_PID $NEXT_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start ChromaDB
echo "[1/3] Starting ChromaDB server..."
chroma run --host localhost --port 8000 &
CHROMA_PID=$!
sleep 3

# Start Flask API
echo "[2/3] Starting Flask Embedding API..."
cd flask_embedding_api
source embedding_env/bin/activate
python app.py &
FLASK_PID=$!
cd ..
sleep 3

# Start Next.js
echo "[3/3] Starting Next.js development server..."
npm run dev &
NEXT_PID=$!
sleep 5

echo ""
echo "==================================="
echo "  All services started!"
echo "==================================="
echo ""
echo "Services running:"
echo "  - ChromaDB:     http://localhost:8000"
echo "  - Flask API:    http://localhost:5000"
echo "  - Next.js App:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
# Open browser (Linux)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000 2>/dev/null
fi

# Wait for all processes
wait
