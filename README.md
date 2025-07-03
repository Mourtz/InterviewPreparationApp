# Interview Preparation App – Web Version

A browser-based app for AI-powered mock technical interviews. Supports OpenAI (cloud), LM Studio (local), and Ollama (local) as AI providers.

### > The development of this app was was done in 1 day with the help of an AI agent, showcasing the power of AI in rapid development.

## 🚀 Features
- **AI Providers:** OpenAI (GPT-3.5/4), LM Studio, Ollama
- **Smart Question Generation:** Tailored coding challenges and theory questions
- **Automated Evaluation:** AI-powered feedback and scoring
- **PDF/Text Upload:** Extracts from CVs and job descriptions (processed in-browser)
- **Language Detection:** Auto-detects programming languages from job description
- **Code Editor:** Syntax highlighting for major languages
- **Timer & Navigation:** Real-time countdown, easy question switching
- **Auto-save & Export:** Answers saved as you type, export results as JSON
- **Responsive & Accessible:** Works on desktop/mobile, keyboard/screen reader friendly

## ⚡ Quick Start (Web Version)
1. **Install Node.js** (v14+)
2. **Get an OpenAI API key** (if using OpenAI)
3. In terminal:
   ```bash
   cd web
   npm install
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser
5. Select AI provider, enter API key if needed, and test connection
6. Upload job description (required) and CV (optional)
7. Configure interview and start!

## 🖥️ Quick Start (Desktop App)
1. **Install Node.js** (v14+)
2. In terminal:
   ```bash
   npm install
   npm start
   ```
3. The Electron app will launch. Use the interface to select AI provider, upload files, and start your interview.

- For advanced options, see the main project README.
- Desktop app supports all features, including local AI (LM Studio, Ollama) and file system access.

## 🧠 AI Provider Setup
- **LM Studio:** Auto-detected if running on `127.0.0.1:1234`
- **Ollama:** Auto-detected if running on `127.0.0.1:11434`
- **OpenAI:** Requires API key
- Model dropdown and connection status update automatically

## 📝 Usage
- **Setup:** Choose provider, upload files, set interview options
- **Interview:** Answer questions in code/text editor, use timer and navigation
- **Results:** Get instant AI feedback, export results, start new sessions

## 🛠️ Troubleshooting
- **Port in use:** Change port with `PORT=3001 npm start`
- **API errors:** Check API key, provider status, or try another provider
- **File upload:** Use PDF or TXT under 10MB
- **Connection:** Ensure provider is running and accessible

---

**Happy Interviewing!**
