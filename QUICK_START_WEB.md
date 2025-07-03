# Quick Start - Web Version

## 🚀 Fastest Way to Run

### Option 1: Using Batch File (Windows)
1. Double-click `start-web.bat`
2. Open browser to `http://localhost:3000`

### Option 2: Using PowerShell (Windows)
1. Right-click `start-web.ps1` → "Run with PowerShell"
2. Open browser to `http://localhost:3000`

### Option 3: Manual Commands
```bash
cd web
npm install
npm start
```

## 📋 What You Need

1. **Node.js** installed (v14+)
2. **OpenAI API Key** from [platform.openai.com](https://platform.openai.com/api-keys)
3. **Modern Browser** (Chrome, Firefox, Safari, Edge)

## 🔧 Configuration

1. **Enter API Key**: In the web interface
2. **Select Model**: GPT-4 (best quality) or GPT-3.5 (faster)
3. **Upload Files**: CV (optional) and Job Description (required)
4. **Configure Interview**: Duration, questions, language, difficulty

## ✅ Verification

- ✅ Server starts without errors
- ✅ Browser opens to http://localhost:3000
- ✅ OpenAI API key test passes
- ✅ File uploads work
- ✅ Interview can be started

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Kill other processes or change port |
| API key invalid | Check at platform.openai.com |
| PDF won't upload | Try converting to .txt file |
| No internet | Check connection for OpenAI API |

---

📖 **Full Documentation**: See `WEB_BUILD_GUIDE.md` for complete details.
