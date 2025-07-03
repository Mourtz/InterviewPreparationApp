# AI Providers Setup

This document explains how to set up different AI providers for the Interview Preparation App.

## Supported AI Providers

### 1. OpenAI (Cloud)
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Setup**: Requires API key from OpenAI
- **Cost**: Pay-per-use
- **Internet**: Required

### 2. LM Studio (Local)
- **Models**: Any compatible local model
- **Setup**: Install LM Studio and load a model
- **Cost**: Free (after initial setup)
- **Internet**: Not required after setup

### 3. Ollama (Local)
- **Models**: Llama 2, Code Llama, Mistral, and others
- **Setup**: Install Ollama and pull models
- **Cost**: Free
- **Internet**: Not required after setup

## Quick Setup Instructions

### OpenAI Setup
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an API key
3. Enter it in the app when prompted

### LM Studio Setup
1. Download [LM Studio](https://lmstudio.ai/)
2. Install and launch
3. Download a compatible model (e.g., Code Llama 7B)
4. Start the local server (default: 127.0.0.1:1234)
5. The app will auto-detect the connection

### Ollama Setup
1. Install [Ollama](https://ollama.ai/)
2. Run: `ollama pull llama2` or your preferred model
3. Start Ollama (default: 127.0.0.1:11434)
4. The app will auto-detect the connection

## Troubleshooting

### Connection Issues
- Check if the service is running
- Verify port numbers
- Check firewall settings

### Model Not Responding
- Ensure model is loaded/running
- Check model compatibility
- Try a different model

For more detailed troubleshooting, see TROUBLESHOOTING.md.
