# Interview Preparation App - Web Version

A web-based version of the Interview Preparation App that runs in any modern browser with OpenAI integration for AI-powered mock technical interviews.

## 🌟 Features

### 🤖 AI-Powered (OpenAI Only)
- **OpenAI Integration**: Uses GPT-3.5/GPT-4 for question generation and evaluation
- **Cloud-based AI**: No local setup required - just an API key
- **Smart Question Generation**: Tailored to job descriptions and candidate background
- **Automated Evaluation**: Detailed performance feedback and scoring

### 📄 Document Processing
- **PDF Support**: Extract text from CV and job description PDFs
- **Text Files**: Plain text document support
- **Browser-based**: No server-side processing required
- **Automatic Language Detection**: Extracts programming languages from job descriptions

### 💻 Interview Experience
- **Full Browser Experience**: No downloads or installations
- **Real-time Timer**: Visual countdown with color-coded warnings
- **Code Editor**: Syntax highlighting for multiple programming languages
- **Question Navigation**: Easy switching between questions
- **Progress Tracking**: Visual indicators for completed questions
- **Auto-save**: Answers saved automatically as you type

### 📊 Results & Export
- **Detailed Feedback**: AI-powered performance analysis
- **Score Visualization**: Clear pass/fail indicators
- **Export Results**: Download interview results as JSON
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or later)
- OpenAI API key from [platform.openai.com](https://platform.openai.com)

### Installation & Setup

1. **Navigate to the web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   - Go to `http://localhost:3000`
   - Enter your OpenAI API key
   - Upload documents and start interviewing!

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## 🔑 OpenAI Setup

1. **Get an API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key

2. **Choose Your Model**:
   - **GPT-4**: Best quality, higher cost
   - **GPT-4 Turbo**: Good balance of quality and speed
   - **GPT-3.5 Turbo**: Fastest and most economical (default)

3. **Security**:
   - Your API key is stored locally in your browser
   - Never shared with our servers
   - Remove from browser storage when done

## 📖 How to Use

### Getting Started

1. **Open the web app** in your browser
2. **Enter your OpenAI API key** and test the connection
3. **Upload your CV/Resume** (optional but recommended)
4. **Upload the job description** (required)
5. **Select interview settings**:
   - Duration (15-90 minutes)
   - Number of questions (3-10)
   - Programming language (auto-detected from job description)
   - Difficulty level
6. **Add any additional requirements** in the text area
7. **Preview questions** (optional) or **start the interview**

### During the Interview

1. **Read each question carefully**
2. **Type your answer** in the code editor
3. **Use the sidebar** for notes and navigation
4. **Switch between questions** using navigation buttons
5. **Monitor the timer** - colors change as time runs low
6. **Auto-save** keeps your answers safe
7. **End interview** when complete or time expires

### After the Interview

1. **Review your AI-generated feedback**
2. **Check your score** and pass/fail status
3. **Read improvement recommendations**
4. **Export results** for future reference
5. **Start a new interview** to practice more

## 🎨 Features Overview

### Smart Question Generation
- Analyzes your CV and job description
- Creates relevant, personalized questions
- Adjusts difficulty based on experience level
- Includes coding challenges when appropriate

### Advanced Code Editor
- Syntax highlighting for 10+ programming languages
- Auto-completion and error detection
- Switch between text and code modes
- Full-screen editing support

### Comprehensive Evaluation
- AI analyzes your answers for technical accuracy
- Evaluates problem-solving approach
- Provides specific improvement suggestions
- Scores based on industry standards

### Responsive Design
- Works on all screen sizes
- Touch-friendly interface for tablets
- Keyboard shortcuts for efficiency
- Accessible design for screen readers

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
```

### Browser Requirements
- Modern browser with ES6+ support
- JavaScript enabled
- Local storage enabled (for API key storage)
- File API support (for document uploads)

### Supported File Types
- **PDFs**: All standard PDF documents
- **Text Files**: .txt files with UTF-8 encoding
- **File Size**: Recommended under 10MB

## 🛠️ Deployment

### Local Development
```bash
npm run dev       # Development with auto-reload
npm start         # Production mode
```

### Deploy to Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

#### Vercel
```bash
# Install Vercel CLI, then:
vercel --prod
```

#### Netlify
```bash
# Build and deploy
npm run build
# Upload dist folder to Netlify
```

#### Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security & Privacy

### Data Handling
- **API Key**: Stored only in browser's local storage
- **Documents**: Processed entirely in browser
- **Answers**: Sent only to OpenAI for evaluation
- **No Data Persistence**: No server-side data storage

### API Key Security
- Never logged or stored on servers
- Transmitted securely to OpenAI via HTTPS
- Can be cleared from browser at any time
- Only used for OpenAI API calls

### Content Policy
- Follows OpenAI's usage policies
- No inappropriate content generation
- Professional interview focus only

## 🚨 Troubleshooting

### Common Issues

**"Invalid API Key" Error**
- Verify your OpenAI API key is correct
- Check your OpenAI account has sufficient credits
- Ensure API key has proper permissions

**File Upload Failed**
- Check file format (PDF or TXT only)
- Verify file size is under 10MB
- Ensure file is not password-protected

**Questions Not Generating**
- Verify API key is working
- Check job description is uploaded
- Try regenerating questions
- Use fallback mode if API is down

**Editor Issues**
- Refresh the page if editor becomes unresponsive
- Check browser console for JavaScript errors
- Try switching editor modes

### Debug Mode
Open browser developer tools (F12) to see:
- API request/response details
- JavaScript console logs
- Network request status
- Local storage contents

## 🤝 Contributing

This is the web version of the Interview Preparation App. Contributions welcome!

### Development Guidelines
1. Use modern JavaScript (ES6+)
2. Maintain responsive design
3. Follow security best practices
4. Test with multiple browsers
5. Ensure accessibility compliance

## 📄 License

MIT License - see package.json for details.

## 🙏 Acknowledgments

- **OpenAI** for providing excellent AI models
- **CodeMirror** for the code editing experience
- **PDF.js** for client-side PDF processing
- **Express.js** for simple web server setup

## 📞 Support

For issues and questions:
1. Check this README for solutions
2. Review browser console for errors
3. Verify OpenAI API key and credits
4. Test with sample documents first

---

**Happy Interviewing! 🚀** Perfect your technical interview skills with AI-powered practice sessions!
