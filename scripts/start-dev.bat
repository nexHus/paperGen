@echo off
REM PaperGenie Development Startup Script for Windows
REM This script starts all required services for local development

echo ===================================
echo   PaperGenie Development Setup
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo [INFO] Starting services...
echo.

REM Start ChromaDB in a new terminal
echo [1/3] Starting ChromaDB server...
start "ChromaDB Server" cmd /k "chroma run --host localhost --port 8000"
timeout /t 3 /nobreak >nul

REM Start Flask API in a new terminal
echo [2/3] Starting Flask Embedding API...
start "Flask Embedding API" cmd /k "cd flask_embedding_api && embedding_env\Scripts\activate && python app.py"
timeout /t 3 /nobreak >nul

REM Start Next.js in a new terminal
echo [3/3] Starting Next.js development server...
start "Next.js Dev Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ===================================
echo   All services started!
echo ===================================
echo.
echo Services running:
echo   - ChromaDB:     http://localhost:8000
echo   - Flask API:    http://localhost:5000  
echo   - Next.js App:  http://localhost:3000
echo.
echo Press any key to open the app in your browser...
pause >nul

start http://localhost:3000
