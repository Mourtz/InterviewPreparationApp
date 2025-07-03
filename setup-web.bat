@echo off
echo 🎯 Interview Preparation App - Web Version Setup
echo =================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found:
node --version

REM Navigate to web directory
cd web

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 🚀 Setup Complete!
echo.
echo To start the web version:
echo   npm start
echo.
echo Then open your browser to: http://localhost:3000
echo.
echo 📋 What you'll need:
echo   1. OpenAI API key from https://platform.openai.com
echo   2. CV/Resume file (PDF or text)
echo   3. Job description file (PDF or text)
echo.
echo Happy interviewing! 🎉
pause
