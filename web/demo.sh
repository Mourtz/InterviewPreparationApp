#!/bin/bash

# Demo runner for Interview Preparation App - Web Version

echo "🎯 Interview Preparation App - Web Demo"
echo "======================================="

# Check if we're in the web directory
if [ ! -f "package.json" ]; then
    echo "📁 Navigating to web directory..."
    cd web
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting web server..."
echo ""
echo "The web version will start on: http://localhost:3000"
echo ""
echo "📋 To test the app, you'll need:"
echo "  1. OpenAI API key (get from https://platform.openai.com)"
echo "  2. Sample CV file (examples/sample-cv.txt included)"
echo "  3. Sample job description (examples/sample-job-description.txt included)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
