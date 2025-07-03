# Interview Preparation App - Web Version Build Guide

## 🎯 Overview
This guide will help you build and run the web version of the Interview Preparation App, which is specifically configured to work **only with OpenAI** for AI-powered mock technical interviews.

## ✅ Prerequisites

### Required Software
- **Node.js** (v14 or later) - [Download from nodejs.org](https://nodejs.org/)
- **OpenAI API Key** - [Get from platform.openai.com](https://platform.openai.com/api-keys)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### System Requirements
- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 50MB for application files
- **Network**: Internet connection for OpenAI API calls

## 🚀 Quick Start Guide

### Step 1: Navigate to Web Directory
```bash
cd web
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Server
```bash
npm start
```
**OR** for development with auto-restart:
```bash
npm run dev
```

### Step 4: Open in Browser
Open your web browser and navigate to:
```
http://localhost:3000
```

### Step 5: Configure OpenAI
1. Enter your OpenAI API key in the configuration section
2. Select your preferred model (GPT-4 recommended, GPT-3.5 for faster responses)
3. Click "Test Connection" to verify your API key works

## � Project Structure
- **Modern Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Internet Connection**: Required for OpenAI API calls

### OpenAI Account Setup
1. **Create OpenAI Account**: Visit [platform.openai.com](https://platform.openai.com)
2. **Get API Key**: 
   - Go to API Keys section
   - Create new secret key
   - Copy and save securely
3. **Add Credits**: Ensure your account has sufficient API credits
4. **Note Costs**: 
   - GPT-3.5-Turbo: ~$0.002 per interview
   - GPT-4: ~$0.02 per interview

## 🛠️ Development Setup

### Local Development
```bash
cd web
npm install
npm run dev        # Development mode with auto-reload
```

### Available Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run build      # Prepare for deployment
npm test           # Run tests (placeholder)
```

### Project Structure
```
web/
├── index.html          # Main HTML file
├── app.js             # Main JavaScript application logic
├── styles.css         # CSS styling
├── server.js          # Express.js web server
├── package.json       # Node.js dependencies
└── README.md          # Detailed documentation
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start development server with auto-restart |
| `npm run build` | Prepare for deployment (currently just displays ready message) |
| `npm run serve` | Alias for `npm start` |

## 🌐 Web Features

### 🤖 AI Integration (OpenAI Only)
- **GPT-3.5 Turbo**: Fast and cost-effective for most interviews
- **GPT-4**: More advanced reasoning for complex technical questions
- **GPT-4 Turbo**: Balance of speed and capability
- **Secure API Key Storage**: Stored locally in browser, never sent to our servers

### 📄 Document Processing
- **PDF Support**: Upload CV and job description PDFs (processed in browser)
- **Text Files**: Plain text document support
- **Automatic Language Detection**: Extracts programming languages from job descriptions
- **No Server Processing**: All file processing happens in your browser for privacy

### 💻 Interview Experience
- **Real-time Timer**: Visual countdown with progress bar
- **Code Editor**: Syntax highlighting for multiple programming languages
- **Question Navigation**: Easy switching between questions
- **Auto-save**: Answers automatically saved as you type
- **Notes Section**: Take quick notes during the interview
- **Text-to-Speech**: Have questions read aloud (browser dependent)

### 📊 Results & Export
- **AI Evaluation**: Detailed performance analysis using OpenAI
- **Score Visualization**: Clear pass/fail indicators with detailed feedback
- **Export Results**: Download interview results as JSON file
- **Study Recommendations**: Personalized suggestions for improvement

## 🔐 Security & Privacy

### API Key Security
- API keys are stored locally in your browser's localStorage
- Keys are never transmitted to our servers
- All OpenAI API calls are made directly from your browser
- You can clear your API key anytime by clearing browser data

### Data Privacy
- All document processing happens locally in your browser
- Interview data is not stored on our servers
- Results are only saved locally unless you explicitly export them

## 🎮 How to Use

### 1. Setup Phase
1. **Configure OpenAI**: Enter your API key and select a model
2. **Upload Documents**: 
   - CV/Resume (optional but recommended)
   - Job Description (required)
3. **Configure Interview**:
   - Select duration (15-90 minutes)
   - Choose number of questions (3-10)
   - Pick programming language
   - Set difficulty level
4. **Add Details**: Specify focus areas or special requirements

### 2. Interview Phase
1. **Timer Management**: Interview starts with countdown timer
2. **Answer Questions**: Use the code editor or text area
3. **Navigate**: Move between questions at your own pace
4. **Take Notes**: Use the notes section for quick thoughts
5. **Save Progress**: Answers auto-save as you type

### 3. Results Phase
1. **AI Evaluation**: Automatic performance assessment
2. **Review Feedback**: Detailed strengths and improvement areas
3. **Export Results**: Download for future reference
4. **Start New Interview**: Begin another session if desired

## 🛠️ Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /f /pid <PID>

# Try a different port
PORT=3001 npm start
```

#### OpenAI API Issues
- **Invalid API Key**: Verify your key at platform.openai.com
- **Rate Limiting**: Wait a few minutes before retrying
- **No Credit**: Check your OpenAI billing dashboard
- **Network Error**: Check your internet connection

#### Browser Issues
- **CodeMirror Not Loading**: Ensure you have an internet connection for CDN resources
- **PDF Not Parsing**: Try converting PDF to text format
- **localStorage Full**: Clear browser data and re-enter API key

### Performance Optimization

#### For Better Performance
- Use GPT-3.5 Turbo instead of GPT-4 for faster responses
- Keep document sizes reasonable (under 10MB)
- Close other browser tabs during interviews
- Use a stable internet connection

## 🚀 Deployment Options

### Local Development
```bash
npm run dev  # Auto-restart on file changes
```

### Production Deployment

#### Option 1: Node.js Server
```bash
npm start  # Production server on port 3000
```

#### Option 2: Static Hosting
Since this is a client-side app, you can host the static files on:
- **Netlify**: Drag and drop the web folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Enable pages in repository settings
- **AWS S3**: Upload files to S3 bucket with static hosting

## ✨ Key Advantages of Web Version

### ✅ Pros
- **No Installation Required**: Runs in any modern browser
- **Cross-Platform**: Works on Windows, Mac, Linux, mobile
- **Auto-Updates**: Always get the latest version
- **Easy Sharing**: Share URL with team members
- **Cloud AI**: No local AI setup required
- **Lightweight**: Minimal system requirements

### ⚠️ Considerations
- **Internet Required**: Needs connection for OpenAI API
- **API Costs**: Pay per OpenAI API usage
- **Browser Dependent**: Features may vary by browser
- **Single AI Provider**: Only supports OpenAI (by design)

## 🎯 Success Tips

1. **Prepare Your Environment**:
   - Ensure stable internet connection
   - Have OpenAI API key ready
   - Prepare CV and job description files

2. **Optimize Your Experience**:
   - Use headphones for text-to-speech
   - Maximize browser window for better layout
   - Practice with shorter interviews first

3. **Get Better Results**:
   - Provide detailed job descriptions
   - Include your CV for personalized questions
   - Specify focus areas in additional details
   - Take time to read questions carefully

---

🎉 **You're Ready!** Your Interview Preparation App web version is now running and ready for mock technical interviews with OpenAI integration.

## 📞 Quick Support

### If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify your OpenAI API key is valid
3. Ensure you have a stable internet connection
4. Try refreshing the browser page

### OpenAI Resources:
- [API Documentation](https://platform.openai.com/docs)
- [Get API Key](https://platform.openai.com/api-keys)
- [Usage Limits](https://platform.openai.com/docs/guides/rate-limits)
