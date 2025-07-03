# 🎯 Interview Preparation App

A powerful desktop application built with Electron that provides AI-powered mock technical interviews to help candidates prepare for their dream jobs.

## ✨ Features

### 📄 Document Processing
- **CV/Resume Upload**: Support for PDF and text formats
- **Job Description Analysis**: Parse job requirements and skills
- **Automatic Text Extraction**: Extract content from uploaded documents

### 🤖 AI Integration
- **Local AI Processing**: Integrates with LM Studio for privacy-focused AI
- **Dynamic Question Generation**: Creates relevant questions based on CV and job description
- **Performance Evaluation**: AI-powered assessment with detailed feedback
- **Fallback Mode**: Works offline with predefined questions when AI is unavailable

### 💻 Interview Experience
- **Configurable Duration**: 15 to 90-minute interview sessions
- **Real-time Timer**: Visual countdown with color-coded warnings
- **Code/Text Editor**: CodeMirror integration with syntax highlighting
- **Question Navigation**: Easy switching between questions
- **Notes Section**: Built-in notepad for quick thoughts
- **Text-to-Speech**: Read questions aloud for better accessibility

### 📊 Results & Feedback
- **Detailed Evaluation**: Comprehensive performance analysis
- **Pass/Fail Assessment**: Clear outcome with numerical scoring
- **Study Recommendations**: Personalized improvement suggestions
- **Export Functionality**: Save results as JSON for future reference

## 🚀 Quick Start

### Choose Your Version

**🖥️ Desktop App (Full Features)**
- Supports LM Studio, Ollama, and OpenAI
- Full file system access
- Native notifications and auto-updater
- Best for local AI models

**🌐 Web App (OpenAI Only)**
- Runs in any modern browser
- Only requires OpenAI API key
- No installation needed
- Perfect for cloud-based AI

### Desktop Installation

### Prerequisites
- Node.js (v14 or later)
- **AI Provider (Optional)**: Choose one for AI-powered features:
  - **LM Studio** (Recommended for beginners) - User-friendly interface
  - **Ollama** (Recommended for advanced users) - Command-line based, faster setup
  - **OpenAI** (Easiest but paid) - Cloud-based, requires API key

### Installation

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

### Web Version Quick Start

1. **Setup the web version**:
   ```bash
   # Windows
   setup-web.bat
   
   # macOS/Linux
   ./setup-web.sh
   
   # Or manually
   cd web
   npm install
   npm start
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Enter your OpenAI API key** and start interviewing!

📖 **Detailed Web Guide**: See `WEB_BUILD_GUIDE.md` for complete web deployment instructions.

### For AI Features (Choose One)

**📖 New!** The app now supports multiple AI providers. See `AI_PROVIDERS_SETUP.md` for detailed setup instructions.

#### Option 1: LM Studio (Recommended for Beginners)
1. **Download and install LM Studio** from [lmstudio.ai](https://lmstudio.ai)
2. **Load a language model** (recommended: 7B+ parameter models like Mistral-7B-Instruct)
3. **Start the LM Studio server** on 127.0.0.1:1234
4. The app will automatically detect and connect to the AI service

#### Option 2: Ollama (Advanced Users)
1. **Install Ollama** from [ollama.ai](https://ollama.ai)
2. **Pull a model**: `ollama pull llama2` or `ollama pull mistral`
3. **Start Ollama**: `ollama serve`
4. Select "Ollama (Local)" in the app's AI Provider dropdown

#### Option 3: OpenAI (Cloud-based)
1. **Get an API key** from [platform.openai.com](https://platform.openai.com)
2. **Select "OpenAI (Cloud)"** in the app's AI Provider dropdown
3. **Enter your API key** when prompted
4. Enjoy instant setup with GPT models

📖 **Detailed Setup Guide**: See `LM_STUDIO_SETUP.md` for complete instructions, model recommendations, and troubleshooting tips.

## 📖 How to Use

### Setting Up an Interview

1. **Launch the app** and you'll see the main setup interface
2. **Upload your CV/Resume** in PDF or text format
3. **Upload the job description** you're preparing for
4. **Set interview duration** (15-90 minutes)
5. **Choose number of questions** (3-10 questions)
6. **Add additional details** like specific technologies or focus areas
7. **Generate preview** to see sample questions (optional)
8. **Start the interview** when ready

### During the Interview

1. **Read each question carefully** - use the 🔊 button for text-to-speech
2. **Type your answer** in the editor - switch between text and code modes
3. **Use the notes section** for quick thoughts and reminders
4. **Navigate between questions** using the sidebar or Next button
5. **Save answers** regularly (Ctrl+S shortcut)
6. **Monitor the timer** - it changes color as time runs low
7. **End the interview** when complete or time expires

### After the Interview

1. **Review your performance** - get AI-generated feedback
2. **Check your score** and pass/fail status
3. **Read detailed recommendations** for improvement
4. **Export results** for future reference
5. **Start a new interview** to practice more

## 🎨 Interface Overview

### Main Setup Window
- Clean, modern interface with gradient background
- Drag-and-drop file upload areas
- Real-time AI connection status
- Form validation and error handling

### Interview Window
- Dark theme for reduced eye strain during long sessions
- Split-panel layout: questions on top, answers below
- Sidebar with notes, controls, and question overview
- Progress bar and timer at the top

### Results Window
- Score visualization with color-coded pass/fail
- Detailed feedback sections
- Export and restart options

## ⚙️ Configuration

### Interview Settings
- **Duration**: 15, 30, 45, 60, or 90 minutes
- **Questions**: 3, 5, 7, or 10 questions per session
- **Editor Mode**: Switch between text and code editing
- **Additional Details**: Custom instructions for AI question generation

### AI Configuration
The app now supports multiple AI providers - choose what works best for you:
- **LM Studio**: Local AI with user-friendly interface
- **Ollama**: Local AI with command-line setup  
- **OpenAI**: Cloud AI with instant setup (requires API key)

📖 **Complete Setup Guide**: See `AI_PROVIDERS_SETUP.md` for detailed instructions for each provider.

### Customization
- Modify prompts in `src/main.js` for different question styles
- Adjust timing and scoring in `renderer/interview.js`
- Customize themes in `renderer/styles.css`

## 🛠️ Development

### Project Structure
```
InterviewPreparationApp/
├── src/
│   └── main.js              # Main Electron process
├── renderer/
│   ├── index.html           # Main setup interface
│   ├── interview.html       # Interview session interface  
│   ├── styles.css           # Application styles
│   ├── renderer.js          # Main window logic
│   └── interview.js         # Interview session logic
├── .github/
│   └── copilot-instructions.md # Development guidelines
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

### Key Technologies
- **Electron**: Cross-platform desktop apps
- **CodeMirror**: Advanced text editing capabilities
- **PDF-Parse**: Document text extraction
- **Axios**: HTTP client for AI communication

### Development Commands
```bash
# Desktop App
npm start          # Start the application
npm run dev        # Start with developer tools open
npm test           # Run tests (placeholder)

# Web Version
npm run web:install    # Install web dependencies
npm run web:start      # Start web server
npm run web:dev        # Start web server with auto-reload
npm run build-web      # Build static web version for deployment
npm run clean-web      # Clean web build directory
```

### Building for Production
```bash
# Desktop App
npm install electron-builder --save-dev
npm run build      # Create distributable packages

# Web App (Static Build)
npm run build-web  # Creates dist/ folder ready for deployment
```

## 🔧 Troubleshooting

### Common Issues

**"LM Studio not detected"**
- Ensure LM Studio is running on 127.0.0.1:1234
- Check that a model is loaded and the server is started
- The app works without AI in fallback mode

**"File upload failed"**
- Verify file format is PDF or TXT
- Check file size (large PDFs may take time to process)
- Ensure file is not corrupted or password-protected

**"Questions not generating"**
- Verify CV and job description are uploaded
- Check AI connection status in the main window
- Try regenerating questions or use fallback mode

**Timer issues**
- Close and restart the interview if timer appears stuck
- Check system time and ensure no sleep mode interruptions

### Debug Mode
Start with `npm run dev` to open developer tools for debugging.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

### Development Guidelines
1. Follow the existing code structure and naming conventions
2. Test with both AI-enabled and fallback modes
3. Ensure responsive design works on different screen sizes
4. Add appropriate error handling for new features
5. Update documentation for any new functionality

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 🙏 Acknowledgments

- **Electron** team for the excellent desktop framework
- **CodeMirror** for the powerful text editing component
- **LM Studio** for making local AI accessible
- **Open source community** for various dependencies and inspiration

## 📞 Support

For questions and support:
1. Check this README for common solutions
2. Review the troubleshooting section
3. Open an issue for bugs or feature requests

---

**Happy Interviewing! 🚀** Good luck with your technical interview preparation!
