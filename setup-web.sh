#!/bin/bash

# Setup script for Interview Preparation App - Web Version

echo "🎯 Interview Preparation App - Web Version Setup"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Navigate to web directory
cd web

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "To start the web version:"
echo "  npm start"
echo ""
echo "Then open your browser to: http://localhost:3000"
echo ""
echo "📋 What you'll need:"
echo "  1. OpenAI API key from https://platform.openai.com"
echo "  2. CV/Resume file (PDF or text)"
echo "  3. Job description file (PDF or text)"
echo ""
echo "Happy interviewing! 🎉"
