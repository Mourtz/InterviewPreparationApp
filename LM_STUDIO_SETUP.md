# LM Studio Integration Setup Guide

## 🤖 Setting Up AI-Powered Features

The Interview Preparation App integrates with LM Studio to provide AI-powered question generation and performance evaluation. Follow this guide to set up the complete AI experience.

### Step 1: Install LM Studio

1. **Download LM Studio**
   - Visit [https://lmstudio.ai](https://lmstudio.ai)
   - Download the version for your operating system (Windows, macOS, or Linux)
   - Install following the standard installation process

### Step 2: Download a Language Model

1. **Open LM Studio**
2. **Browse Models** - Click on the "Search" tab
3. **Choose a Model** - Recommended options:
   - **For beginners**: `microsoft/DialoGPT-medium` or similar 7B models
   - **For better performance**: `mistralai/Mistral-7B-Instruct-v0.1` 
   - **For advanced users**: `codellama/CodeLlama-13b-Instruct-hf`
   
4. **Download** - Click download and wait for completion (models are typically 4-20GB)

### Step 3: Load and Start the Model

1. **Load Model**
   - Go to the "Chat" tab in LM Studio
   - Select your downloaded model from the dropdown
   - Click "Load Model" and wait for it to load into memory

2. **Start Server**
   - Go to the "Local Server" tab
   - Ensure the port is set to `1234` (default)
   - Click "Start Server"
   - You should see "Server running on http://127.0.0.1:1234"

### Step 4: Verify Connection

1. **Open Interview Preparation App**
2. **Check AI Status** - On the main screen, you should see:
   - Green dot next to "LM Studio connected"
   - Model name displayed
   - Ready status message

3. **Test Features**
   - Upload a CV and job description
   - Click "Preview Questions" to test AI question generation
   - Complete a mock interview to test AI evaluation

## 🎯 Recommended Models

### For General Interviews
- **Mistral 7B Instruct** - Good balance of performance and speed
- **Llama 2 7B Chat** - Reliable for conversation and evaluation

### For Technical Interviews
- **CodeLlama 7B/13B** - Specialized for coding questions
- **WizardCoder** - Good for programming challenges

### For Advanced Users
- **Llama 2 13B** - Better reasoning for complex evaluations
- **Claude-like models** - More detailed feedback

## ⚙️ Configuration Tips

### Performance Optimization
- **RAM**: Ensure you have enough RAM (8GB+ for 7B models, 16GB+ for 13B)
- **CPU/GPU**: Models run faster with GPU acceleration if available
- **Storage**: Keep 20-50GB free space for model files

### Model Settings
- **Temperature**: 0.7 for question generation, 0.3 for evaluation (app handles this)
- **Max Tokens**: App automatically sets appropriate limits
- **Context Length**: Longer context helps with better evaluations

## 🔧 Troubleshooting

### "LM Studio not detected"
1. Verify LM Studio is running
2. Check server is started on port 1234
3. Ensure model is loaded (not just downloaded)
4. Try clicking "Check Again" in the app

### Slow Response Times
1. Use smaller models (7B instead of 13B+)
2. Close other resource-intensive applications
3. Check if GPU acceleration is available
4. Reduce context length if possible

### Poor Question Quality
1. Try different models (CodeLlama for technical roles)
2. Provide more detailed job descriptions
3. Add specific focus areas in the "Additional Details" section
4. Use more recent/specialized models

### Connection Errors
1. Check firewall settings
2. Verify 127.0.0.1:1234 is accessible
3. Restart LM Studio server
4. Try different port (update app configuration if needed)

## 📊 Expected Performance

### Question Generation
- **Time**: 10-30 seconds depending on model size
- **Quality**: Tailored to CV and job description
- **Variety**: Technical, behavioral, and role-specific questions

### Performance Evaluation
- **Time**: 30-60 seconds for comprehensive analysis
- **Features**: 
  - Numerical scoring (0-100)
  - Pass/fail determination
  - Detailed strengths/weaknesses
  - Study recommendations
  - Communication feedback

## 🚀 Advanced Usage

### Custom Prompts
- Modify prompts in `src/main.js` for specialized interview types
- Adjust evaluation criteria for different roles
- Add industry-specific question templates

### Multiple Models
- Use different models for question generation vs evaluation
- Switch models based on interview type (frontend, backend, etc.)
- Load specialized models for specific technologies

## 🆘 Support

### App Works Without AI
- The Interview Preparation App functions fully without LM Studio
- Fallback questions are provided automatically
- Basic evaluation guidance is available

### Getting Help
1. Check LM Studio documentation
2. Verify system requirements
3. Test with smaller models first
4. Check app console for error messages

---

**Ready to start?** Follow the steps above, then launch the Interview Preparation App and look for the green "Connected" status! 🎯
