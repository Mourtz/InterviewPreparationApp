const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Import shared utilities
const { extractProgrammingLanguages, getLanguageOptions } = require('../shared/languageUtils');
const { extractTextFromFile } = require('../shared/fileUtils');

// AI Provider Configuration
const AI_PROVIDERS = {
    lmstudio: {
        name: 'LM Studio',
        baseUrl: 'http://127.0.0.1:1234',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: false,
        defaultModel: null // Will be auto-detected
    },
    ollama: {
        name: 'Ollama',
        baseUrl: 'http://127.0.0.1:11434',
        apiPath: '/api/chat',
        modelsPath: '/api/tags',
        requiresApiKey: false,
        defaultModel: 'llama2' // Common default
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: true,
        defaultModel: 'gpt-3.5-turbo'
    }
};

// Global AI configuration
let currentAIProvider = 'lmstudio'; // Default provider
let aiApiKey = null; // For OpenAI

// Suppress cache warnings on Windows
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--no-sandbox');

let mainWindow;
let interviewWindow;

function createMainWindow() {
    const isProduction = app.isPackaged;
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: !isProduction // Disable dev tools in production
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        titleBarStyle: 'default',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Disable dev tools and context menu in production
    if (isProduction) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (input.key === 'F12' || 
                (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
                (input.control && input.key === 'U')) {
                event.preventDefault();
            }
        });
        
        mainWindow.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
        
        // Disable menu bar
        mainWindow.setMenuBarVisibility(false);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open DevTools in development only
    if (process.argv.includes('--dev') && !isProduction) {
        mainWindow.webContents.openDevTools();
    }
}

function createInterviewWindow() {
    const isProduction = app.isPackaged;
    
    interviewWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !isProduction // Disable dev tools in production
        },
        parent: mainWindow,
        modal: false,
        show: false
    });

    interviewWindow.loadFile(path.join(__dirname, '../renderer/interview.html'));

    // Disable dev tools and context menu in production
    if (isProduction) {
        interviewWindow.webContents.on('before-input-event', (event, input) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (input.key === 'F12' || 
                (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
                (input.control && input.key === 'U')) {
                event.preventDefault();
            }
        });
        
        interviewWindow.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
        
        // Disable menu bar
        interviewWindow.setMenuBarVisibility(false);
    }

    interviewWindow.once('ready-to-show', () => {
        interviewWindow.show();
        if (mainWindow) {
            mainWindow.hide();
        }
    });

    interviewWindow.on('closed', () => {
        interviewWindow = null;
        if (mainWindow) {
            mainWindow.show();
        }
    });
}

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers
ipcMain.handle('upload-file', async (event, fileType) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Documents', extensions: ['pdf', 'txt'] },
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'Text Files', extensions: ['txt'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileExtension = path.extname(filePath).toLowerCase();
        let type = fileExtension === '.pdf' ? 'pdf' : fileExtension === '.txt' ? 'txt' : null;
        if (!type) return { success: false, error: 'Unsupported file type' };
        try {
            const content = await extractTextFromFile(filePath, type, 'electron');
            return {
                success: true,
                fileName: path.basename(filePath),
                content: content,
                type: fileType
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    return { success: false, error: 'No file selected' };
});

// AI Provider Management IPC Handlers
ipcMain.handle('get-ai-providers', async () => {
    return {
        success: true,
        providers: Object.keys(AI_PROVIDERS).map(id => ({
            id,
            name: AI_PROVIDERS[id].name,
            requiresApiKey: AI_PROVIDERS[id].requiresApiKey,
            isCurrent: id === currentAIProvider
        })),
        currentProvider: currentAIProvider
    };
});

ipcMain.handle('set-ai-provider', async (event, { providerId, apiKey = null }) => {
    console.log(`🔄 Switching AI provider to: ${providerId}`);
    
    if (!AI_PROVIDERS[providerId]) {
        return {
            success: false,
            error: `Unknown AI provider: ${providerId}`
        };
    }
    
    currentAIProvider = providerId;
    
    if (providerId === 'openai') {
        if (!apiKey) {
            return {
                success: false,
                error: 'OpenAI requires an API key'
            };
        }
        aiApiKey = apiKey;
    }
    
    console.log(`✅ AI provider switched to: ${AI_PROVIDERS[providerId].name}`);
    return {
        success: true,
        provider: {
            id: providerId,
            name: AI_PROVIDERS[providerId].name
        }
    };
});

ipcMain.handle('test-ai-provider', async (event, { providerId, apiKey = null }) => {
    try {
        console.log(`🧪 Testing AI provider: ${providerId}`);
        
        const config = getProviderConfig(providerId);
        
        // Temporarily set provider and API key for testing
        const originalProvider = currentAIProvider;
        const originalApiKey = aiApiKey;
        
        currentAIProvider = providerId;
        if (providerId === 'openai' && apiKey) {
            aiApiKey = apiKey;
        }
        
        // Test connection by fetching models
        const modelsUrl = buildApiUrl(providerId, config.modelsPath);
        const headers = buildHeaders(providerId);
        
        const response = await axios.get(modelsUrl, {
            headers: headers,
            timeout: 10000
        });
        
        // Restore original settings
        currentAIProvider = originalProvider;
        aiApiKey = originalApiKey;
        
        console.log(`✅ ${config.name} connection test successful`);
        return {
            success: true,
            message: `Successfully connected to ${config.name}`,
            responseStatus: response.status
        };
        
    } catch (error) {
        console.error(`❌ ${providerId} connection test failed:`, error.message);
        
        let errorMessage = `Cannot connect to ${AI_PROVIDERS[providerId]?.name || providerId}`;
        if (error.response?.status === 401) {
            errorMessage = 'Invalid API key';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = `${AI_PROVIDERS[providerId]?.name || providerId} server not running`;
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('start-interview', async (event, interviewData) => {
    // Store interview data for the interview window
    global.interviewData = interviewData;
    createInterviewWindow();
    return { success: true };
});

ipcMain.handle('get-interview-data', async () => {
    return global.interviewData || {};
});

ipcMain.handle('end-interview', async (event, results) => {
    // Store results and close interview window
    global.interviewResults = results;
    if (interviewWindow) {
        interviewWindow.close();
    }
    return { success: true };
});

ipcMain.handle('get-interview-results', async () => {
    return global.interviewResults || {};
});

// Extract programming languages from job description
ipcMain.handle('extract-languages', async (event, jobDescription) => {
    try {
        const languages = extractProgrammingLanguages(jobDescription);
        const formattedLanguages = getLanguageOptions(languages);
        return {
            success: true,
            languages: formattedLanguages
        };
    } catch (error) {
        console.error('Language extraction error:', error);
        return {
            success: false,
            error: 'Failed to extract languages'
        };
    }
});

// Get available AI models from current provider
ipcMain.handle('get-available-models', async () => {
    try {
        const config = getProviderConfig(currentAIProvider);
        console.log(`🔍 Fetching available models from ${config.name}...`);
        
        const modelsUrl = buildApiUrl(currentAIProvider, config.modelsPath);
        const headers = buildHeaders(currentAIProvider);
        
        const response = await axios.get(modelsUrl, {
            timeout: 10000,
            headers: headers
        });
        
        let models = [];
        let defaultModel = null;
        
        // Parse response based on provider
        if (currentAIProvider === 'ollama') {
            if (response.data && response.data.models) {
                models = response.data.models.map((model, index) => ({
                    id: model.name,
                    name: model.name,
                    displayName: model.name.replace(/[-_]/g, ' '),
                    size: model.size ? `${Math.round(model.size / 1024 / 1024 / 1024 * 10) / 10}GB` : '',
                    isActive: index === 0
                }));
                defaultModel = models[0]?.id;
            }
        } else if (currentAIProvider === 'openai') {
            if (response.data && response.data.data) {
                // Filter to commonly used chat models
                const chatModels = response.data.data.filter(model => 
                    model.id.includes('gpt') || model.id.includes('chat')
                );
                models = chatModels.map((model, index) => ({
                    id: model.id,
                    name: model.id,
                    displayName: model.id.replace(/[-_]/g, ' ').toUpperCase(),
                    isActive: model.id === 'gpt-3.5-turbo'
                }));
                defaultModel = 'gpt-3.5-turbo';
            }
        } else { // lmstudio and others
            if (response.data && response.data.data && response.data.data.length > 0) {
                models = response.data.data.map((model, index) => ({
                    id: model.id,
                    name: model.id,
                    displayName: model.id.includes('/') ? 
                        model.id.split('/').pop().replace(/[-_]/g, ' ') : 
                        model.id.replace(/[-_]/g, ' '),
                    isActive: index === 0
                }));
                defaultModel = models[0]?.id;
            }
        }
        
        if (models.length > 0) {
            console.log(`✅ Found ${models.length} models from ${config.name}:`, 
                models.map(m => `${m.name}${m.isActive ? ' (active)' : ''}`));
            
            return {
                success: true,
                models: models,
                defaultModel: defaultModel,
                activeModel: defaultModel,
                provider: config.name
            };
        } else {
            console.log(`⚠️ ${config.name} running but no models found`);
            return {
                success: false,
                error: `No models available in ${config.name}`,
                models: [],
                provider: config.name
            };
        }
    } catch (error) {
        console.error(`❌ Error fetching models from ${currentAIProvider}:`, error);
        
        const config = getProviderConfig(currentAIProvider);
        let errorMessage = `Cannot connect to ${config.name}`;
        
        if (error.response?.status === 401) {
            errorMessage = 'Invalid API key';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = `${config.name} server not running`;
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            errorMessage = `${config.name} connection timed out`;
        }
        
        return {
            success: false,
            error: errorMessage,
            models: [],
            provider: config.name
        };
    }
});

// Test IPC handler to verify communication
ipcMain.handle('ping', async () => {
    console.log('🏓 PING received in main process');
    return { success: true, message: 'pong', timestamp: new Date().toISOString() };
});

// Simple test handler without any network calls
ipcMain.handle('test-handler', async () => {
    console.log('🧪 TEST handler called in main process');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    console.log('🧪 TEST handler completing');
    return { success: true, message: 'Test completed', timestamp: new Date().toISOString() };
});

// AI Integration handlers
ipcMain.handle('check-ai-connection', async () => {
    const config = getProviderConfig(currentAIProvider);
    console.log(`🔍 Starting AI connection check for ${config.name}...`);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Create a promise that will timeout after 8 seconds
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            console.log('⏰ [MAIN] Manual timeout triggered after 8 seconds');
            reject(new Error('Manual timeout after 8 seconds'));
        }, 8000);
    });
    
    try {
        const modelsUrl = buildApiUrl(currentAIProvider, config.modelsPath);
        const headers = buildHeaders(currentAIProvider);
        
        console.log(`📡 Attempting to connect to ${config.name} at ${modelsUrl}`);
        console.log('🔧 Request timeout set to 5000ms');
        
        console.log('🚀 Making request...');
        const startTime = Date.now();
        
        const axiosPromise = axios.get(modelsUrl, {
            timeout: 5000,
            headers: headers
        });
        
        // Race between axios request and manual timeout
        const response = await Promise.race([axiosPromise, timeoutPromise]);
        
        const endTime = Date.now();
        console.log(`⚡ Request completed in ${endTime - startTime}ms`);
        
        console.log(`✅ Response received from ${config.name}:`, response.status);
        
        // Check if we have models available
        let hasModels = false;
        let modelName = 'Unknown';
        
        // Also check if we have models available for better status reporting
        if (currentAIProvider === 'ollama') {
            hasModels = response.data?.models && response.data.models.length > 0;
            modelName = response.data?.models?.[0]?.name || 'No models available';
        } else if (currentAIProvider === 'openai') {
            hasModels = true; // OpenAI always has models available with valid API key
            modelName = 'GPT Models Available';
        } else { // lmstudio
            hasModels = response.data?.data && response.data.data.length > 0;
            modelName = response.data?.data?.[0]?.id || 'No models loaded';
        }
        
        if (hasModels) {
            console.log(`✅ Models found in ${config.name}:`, modelName);
            return { 
                success: true, 
                connected: true, 
                modelName: modelName,
                status: `Connected to ${config.name}`,
                provider: config.name
            };
        } else {
            console.log(`⚠️ ${config.name} running but no models available`);
            return { 
                success: true, 
                connected: false, 
                status: `${config.name} running but no models loaded`,
                provider: config.name
            };
        }
    } catch (error) {
        const endTime = Date.now();
        console.log(`❌ AI connection error for ${config.name}:`, error.message);
        console.log('⏰ Error occurred at:', new Date().toISOString());
        console.log('🔍 Error details:', {
            code: error.code,
            message: error.message,
            timeout: error.code === 'ECONNABORTED' ? 'Request timed out' : 'No timeout'
        });
        
        // Provide more specific error messages
        let errorMessage = `${config.name} not detected - using fallback mode`;
        
        if (error.response?.status === 401) {
            errorMessage = `${config.name} authentication failed - check API key`;
        } else if (error.code === 'ECONNREFUSED') {
            if (currentAIProvider === 'ollama') {
                errorMessage = 'Ollama not running - start with "ollama serve"';
            } else if (currentAIProvider === 'lmstudio') {
                errorMessage = 'LM Studio not running - start the local server';
            } else {
                errorMessage = `${config.name} server not running`;
            }
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            errorMessage = `${config.name} connection timed out`;
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = `${config.name} server not found - check URL`;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Connection check timed out';
        }
        
        return { 
            success: true, 
            connected: false, 
            status: errorMessage,
            error: error.message,
            provider: config.name
        };
    }
});

// Alternative AI connection check using a simpler endpoint
ipcMain.handle('check-ai-connection-simple', async () => {
    console.log('🔍 Starting simple AI connection check...');
    
    try {
        // Try a simple health check first
        console.log('🏥 Trying health check endpoint...');
        const healthResponse = await axios.get('http://127.0.0.1:1234/health', {
            timeout: 3000
        });
        console.log('✅ Health check successful:', healthResponse.status);
        
        return { 
            success: true, 
            connected: true, 
            status: 'LM Studio server is running',
            health: 'OK'
        };
    } catch (healthError) {
        console.log('⚠️ Health check failed, trying root endpoint...');
        
        try {
            // Try root endpoint
            const rootResponse = await axios.get('http://127.0.0.1:1234/', {
                timeout: 3000
            });
            console.log('✅ Root endpoint accessible:', rootResponse.status);
            
            return { 
                success: true, 
                connected: true, 
                status: 'LM Studio server detected',
                endpoint: 'root'
            };
        } catch (rootError) {
            console.log('❌ All simple checks failed');
            return { 
                success: true, 
                connected: false, 
                status: 'LM Studio not detected',
                error: `Health: ${healthError.message}, Root: ${rootError.message}`
            };
        }
    }
});

// Very simple AI connection check using Node.js built-in http
ipcMain.handle('check-ai-simple-http', async () => {
    console.log('🔍 Starting simple HTTP check...');
    
    return new Promise((resolve) => {
        const http = require('http');
        
        const request = http.get('http://127.0.0.1:1234/v1/models', {
            timeout: 5000
        }, (response) => {
            console.log('✅ Got HTTP response:', response.statusCode);
            
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                console.log('✅ HTTP response complete');
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        success: true,
                        connected: true,
                        status: 'HTTP connection successful',
                        data: parsed
                    });
                } catch (parseError) {
                    resolve({
                        success: true,
                        connected: true,
                        status: 'HTTP connected but invalid JSON',
                        rawData: data.substring(0, 100)
                    });
                }
            });
        });
        
        request.on('error', (error) => {
            console.log('❌ HTTP error:', error.message);
            resolve({
                success: true,
                connected: false,
                status: 'HTTP connection failed',
                error: error.message
            });
        });
        
        request.on('timeout', () => {
            console.log('⏰ HTTP timeout');
            request.destroy();
            resolve({
                success: true,
                connected: false,
                status: 'HTTP connection timed out'
            });
        });
    });
});

ipcMain.handle('generate-questions', async (event, data) => {
    console.log('🤖 === STARTING QUESTION GENERATION ===');
    console.log('📋 Received data:', JSON.stringify(data, null, 2));
    console.log('🎯 Interview type:', data.interviewType || 'coding');
    console.log('🔤 Programming language:', data.programmingLanguage || 'python');
    console.log('📊 Question count:', data.questionCount || 5);
    
    try {
        // Enhanced prompt for coding challenges and different languages
        const languageMap = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'python': 'Python',
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
            'go': 'Go',
            'rust': 'Rust',
            'php': 'PHP',
            'ruby': 'Ruby',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'scala': 'Scala',
            'sql': 'SQL'
        };
        
        const language = languageMap[data.programmingLanguage] || 'Python';
        const interviewType = data.interviewType || 'coding';
        
        let prompt = '';
        
        if (interviewType === 'coding') {
            prompt = `SYSTEM: You are a STRICT LeetCode-style algorithmic problem generator.

🚫 ABSOLUTE PROHIBITIONS - INSTANT FAILURE:
- DO NOT ask about "experience with technologies"
- DO NOT mention "job description" or "candidate background"
- DO NOT ask "What is your experience with..."
- DO NOT ask "How familiar are you with..."
- DO NOT ask "Tell me about your experience..."
- DO NOT generate ANY discussion questions

✅ MANDATORY REQUIREMENTS:
- EVERY question MUST start with "Write a function that..." or "Implement a function that..."
- ONLY generate computational algorithms requiring code implementation
- Focus on data structures, algorithms, and problem-solving
- Each problem must be solvable with pure logic and coding

STRICT FORMAT (NO DEVIATIONS):
**Problem 1: [Algorithm Name]**
Write a function that [specific computational task].

Input: [data structure example]
Output: [expected return value]
Example:
  Input: [concrete example]
  Output: [expected result]

**Problem 2: [Algorithm Name]**
Write a function that [specific computational task].
...

REQUIRED TOPICS FOR ${language} CODING INTERVIEW:
- Array/String manipulation algorithms
- Searching and sorting algorithms  
- Data structure implementations (stacks, queues, trees)
- Dynamic programming problems
- Graph traversal algorithms
- Mathematical computations

GENERATE EXACTLY ${data.questionCount} ALGORITHMIC CODING PROBLEMS NOW.
LANGUAGE: ${language}
NO EXPERIENCE QUESTIONS ALLOWED - ONLY PURE ALGORITHMIC CHALLENGES.`;
        } else if (interviewType === 'theoretical') {
        } else if (interviewType === 'theoretical') {
            const candidateSection = data.cv && data.cv.trim() 
                ? `CANDIDATE BACKGROUND:\n${data.cv}\n\n` 
                : `CANDIDATE INFO: No CV provided - focus on general ${language} competency assessment\n\n`;
                
            prompt = `You are conducting a theoretical technical interview for a ${extractJobTitle(data.jobDescription)} position.

${candidateSection}JOB REQUIREMENTS:
${data.jobDescription}

INTERVIEW SPECIFICATIONS:
- Focus Technology: ${language}
- Duration: ${data.duration} minutes
- Number of questions: ${data.questionCount}
- Interview Type: Theoretical Questions
- Additional focus: ${data.additionalDetails || 'Core concepts and best practices'}

Generate exactly ${data.questionCount} theoretical questions about ${language} and software development that:
1. Test deep understanding of ${language} concepts
2. Cover software engineering principles
${data.cv && data.cv.trim() ? '3. Match the candidate\'s experience level based on their background' : '3. Are suitable for various experience levels'}
4. Are relevant to the job requirements
5. Allow for detailed explanations and discussions

Topics to consider:
- ${language} language features and best practices
- Object-oriented programming (if applicable)
- Design patterns
- Performance optimization
- Testing strategies
- Code architecture and clean code principles

Format each question clearly with expected depth of answer.`;
        } else if (interviewType === 'system-design') {
            const candidateSection = data.cv && data.cv.trim() 
                ? `CANDIDATE BACKGROUND:\n${data.cv}\n\n` 
                : `CANDIDATE INFO: No CV provided - design problems suitable for general skill level\n\n`;
                
            prompt = `You are conducting a system design interview for a ${extractJobTitle(data.jobDescription)} position.

${candidateSection}JOB REQUIREMENTS:
${data.jobDescription}

INTERVIEW SPECIFICATIONS:
- Duration: ${data.duration} minutes
- Number of design problems: ${data.questionCount}
- Interview Type: System Design
- Technology focus: ${language} (where applicable)
- Additional focus: ${data.additionalDetails || 'Scalable system architecture'}

Generate exactly ${data.questionCount} system design problems that:
${data.cv && data.cv.trim() ? '1. Match the candidate\'s experience level based on their background' : '1. Are suitable for various experience levels'}
2. Are relevant to the job requirements
3. Test scalability, reliability, and performance considerations
4. Can be discussed and diagrammed within the time limit
5. Include both high-level architecture and detailed component design

For each problem, provide:
- Problem statement
- Expected user scale/load
- Key requirements (functional and non-functional)
- Discussion points to explore
- Technology considerations (databases, caching, etc.)`;
        } else { // mixed
            const candidateSection = data.cv && data.cv.trim() 
                ? `CANDIDATE BACKGROUND:\n${data.cv}\n\n` 
                : `CANDIDATE INFO: No CV provided - balanced assessment for general skill level\n\n`;
                
            prompt = `You are conducting a mixed technical interview for a ${extractJobTitle(data.jobDescription)} position.

${candidateSection}JOB REQUIREMENTS:
${data.jobDescription}

INTERVIEW SPECIFICATIONS:
- Programming Language: ${language}
- Duration: ${data.duration} minutes
- Total questions: ${data.questionCount}
- Interview Type: Mixed (Coding + Theory)
- Additional focus: ${data.additionalDetails || 'Balanced assessment'}

Generate exactly ${data.questionCount} questions with a mix of:
- ${Math.ceil(data.questionCount * 0.6)} coding challenges in ${language}
- ${Math.floor(data.questionCount * 0.4)} theoretical/conceptual questions

The questions should:
${data.cv && data.cv.trim() ? '1. Match the candidate\'s experience level based on their background' : '1. Be suitable for various experience levels'}
2. Test both practical coding skills and theoretical knowledge
3. Be relevant to the job requirements
4. Progress appropriately in difficulty
5. Be completable within the time allocation

Clearly label each question as either [CODING] or [THEORY] and provide appropriate detail for each type.`;
        }

        // Get selected model or use available model
        let modelName = data.selectedModel;
        console.log('🎯 Selected model from data:', modelName);
        
        if (!modelName) {
            console.log('🔍 No model selected, fetching available models...');
            // Fallback to first available model
            const config = getProviderConfig(currentAIProvider);
            const modelsUrl = buildApiUrl(currentAIProvider, config.modelsPath);
            const headers = buildHeaders(currentAIProvider);
            
            const modelsResponse = await axios.get(modelsUrl, {
                timeout: 5000,
                headers: headers
            });
            
            if (currentAIProvider === 'ollama') {
                modelName = modelsResponse.data.models?.[0]?.name || config.defaultModel;
            } else if (currentAIProvider === 'openai') {
                modelName = config.defaultModel;
            } else { // lmstudio
                modelName = modelsResponse.data.data?.[0]?.id || 'local-model';
            }
            console.log('🎯 Auto-selected model:', modelName);
        }
        
        console.log(`🤖 Using AI model: ${modelName} via ${getProviderConfig(currentAIProvider).name}`);
        console.log('📝 Generated prompt length:', prompt.length, 'characters');
        console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');
        
        console.log(`🚀 Making API request to ${getProviderConfig(currentAIProvider).name}...`);
        
        const messages = [
            {
                role: 'system',
                content: `You are a DEDICATED algorithmic coding challenge generator. Your EXCLUSIVE purpose is creating LeetCode-style programming problems.

ZERO TOLERANCE RULES:
❌ NEVER EVER ask about "experience with technologies"
❌ NEVER ask about candidate background or knowledge
❌ NEVER mention "job description" or "technologies mentioned"
❌ NEVER generate discussion or explanation questions
❌ NEVER ask "What is your..." or "How familiar are you..."

✅ ONLY GENERATE:
- "Write a function that..." problems
- "Implement a function that..." problems  
- Pure algorithmic coding challenges
- Data structure and algorithm problems

🎯 MANDATORY OUTPUT FORMAT:
**Problem 1: [Name]**
Write a function that [algorithmic task].

**Problem 2: [Name]**  
Write a function that [algorithmic task].

If you generate ANYTHING other than pure coding challenges, you will be immediately replaced with fallback questions. Your job is ONLY to create algorithm problems that require writing code to solve.`
            },
            {
                role: 'user',
                content: prompt
            }
        ];
        
        // Use the new AI provider system
        const questions = await makeAIRequest(messages, modelName, currentAIProvider);
        
        console.log('🎯 AI Generated Content (Full Response):');
        console.log('=====================================');
        console.log(questions);
        console.log('=====================================');
        console.log('📏 Response length:', questions.length, 'characters');
        
        // Special check for the exact problematic phrase
        if (questions.toLowerCase().includes('what is your experience with the main technologies mentioned in the job description')) {
            console.log('🚨 DETECTED EXACT PROBLEMATIC PHRASE - forcing fallback');
            return { 
                success: false, 
                error: 'AI generated the exact forbidden experience question',
                fallbackQuestions: generateFallbackQuestions(data)
            };
        }
        
        // Validate that the response contains actual coding problems, not experience questions
        if (interviewType === 'coding') {
            const invalidPhrases = [
                'what is your experience',
                'what is your experience with the main technologies mentioned in the job description',
                'what is your experience with the main technologies',
                'main technologies mentioned in the job description',
                'technologies mentioned in the job description',
                'experience with the main technologies',
                'how would you',
                'explain the',
                'describe your',
                'tell me about',
                'what do you think',
                'how do you approach',
                'what are your thoughts',
                'can you discuss',
                'what is your familiarity',
                'what is your',
                'experience with',
                'how familiar are you',
                'describe how',
                'what are the',
                'how do you',
                'what would you',
                'your experience',
                'your knowledge',
                'your understanding',
                'main technologies mentioned',
                'technologies mentioned',
                'mentioned in the job',
                'job description',
                'knowledge of',
                'familiarity with',
                'background in',
                'work with these technologies',
                'experience working with',
                'used these technologies',
                'comfort level',
                'proficiency in',
                'expertise in',
                'thoughts on',
                'opinion about'
            ];
            
            const requiredPhrases = [
                'write a function',
                'implement a function',
                'implement',
                'algorithm'
            ];
            
            const lowerCaseQuestions = questions.toLowerCase();
            const hasInvalidContent = invalidPhrases.some(phrase => lowerCaseQuestions.includes(phrase));
            const hasValidContent = requiredPhrases.some(phrase => lowerCaseQuestions.includes(phrase));
            
            console.log(`🔍 Enhanced Validation Results:`);
            console.log(`   Has invalid content: ${hasInvalidContent}`);
            console.log(`   Has valid content: ${hasValidContent}`);
            
            if (hasInvalidContent) {
                const foundInvalid = invalidPhrases.filter(phrase => lowerCaseQuestions.includes(phrase));
                console.log(`   Found invalid phrases: ${foundInvalid.join(', ')}`);
            }
            
            // Additional validation: check for common algorithmic terms
            const algorithmicTerms = [
                'array', 'string', 'linked list', 'tree', 'graph', 'hash', 'sort', 'search',
                'input:', 'output:', 'example:', 'constraint', 'time complexity', 'space complexity',
                'binary', 'recursive', 'iterative', 'two pointer', 'sliding window'
            ];
            
            const hasAlgorithmicContent = algorithmicTerms.some(term => lowerCaseQuestions.includes(term));
            console.log(`   Has algorithmic content: ${hasAlgorithmicContent}`);
            
            // Reject if ANY invalid content OR insufficient algorithmic content
            if (hasInvalidContent || !hasValidContent || !hasAlgorithmicContent) {
                console.log('⚠️ AI generated invalid/insufficient content, using fallback coding challenges');
                console.log('Rejection reasons:');
                console.log(`  - Invalid content: ${hasInvalidContent}`);
                console.log(`  - Missing valid content: ${!hasValidContent}`);
                console.log(`  - Missing algorithmic content: ${!hasAlgorithmicContent}`);
                
                return { 
                    success: false, 
                    error: 'AI generated non-coding content, switched to verified algorithmic challenges',
                    fallbackQuestions: generateFallbackQuestions(data)
                };
            }
            
            // Final safety check: look for specific problematic patterns
            const problematicPatterns = [
                /what is your experience with.*technologies/i,
                /experience with.*mentioned/i,
                /main technologies mentioned/i,
                /tell me about your experience/i,
                /how familiar are you/i
            ];
            
            const hasProblematicPatterns = problematicPatterns.some(pattern => pattern.test(questions));
            
            if (hasProblematicPatterns) {
                console.log('⚠️ Detected problematic patterns in AI response, using fallback');
                return { 
                    success: false, 
                    error: 'AI generated experience questions instead of coding challenges',
                    fallbackQuestions: generateFallbackQuestions(data)
                };
            }
            
            console.log('✅ AI response passed all validation checks');
        }
        
        return { success: true, questions: questions, modelUsed: modelName };
    } catch (error) {
        console.error('❌ AI Generation Error Details:');
        console.error('   Error type:', error.constructor.name);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        
        if (error.response) {
            console.error('   HTTP Status:', error.response.status);
            console.error('   HTTP Data:', error.response.data);
        }
        
        const config = getProviderConfig(currentAIProvider);
        const errorMessage = error.code === 'ECONNREFUSED' 
            ? `Cannot connect to ${config.name}. Please ensure it is running and accessible.`
            : `AI Error: ${error.message}`;
            
        console.log('🔄 Falling back to curated coding challenges');
        return { 
            success: false, 
            error: errorMessage,
            fallbackQuestions: generateFallbackQuestions(data)
        };
    }
});

ipcMain.handle('evaluate-performance', async (event, data) => {
    try {
        // Enhanced evaluation prompt
        const prompt = `You are an experienced technical interviewer evaluating a candidate's interview performance.

INTERVIEW DETAILS:
- Questions Asked: ${data.questions.length} questions
- Questions Answered: ${data.answersProvided || data.answers.filter(a => a && a.trim()).length}
- Time Allocated: ${data.duration}
- Completion Rate: ${Math.round((data.answersProvided / data.questions.length) * 100)}%

QUESTIONS AND RESPONSES:
${data.questions.map((q, i) => `
Question ${i + 1}: ${q}
Answer: ${data.answers[i] || '[No answer provided]'}
Length: ${data.answers[i] ? data.answers[i].trim().length : 0} characters
`).join('\n')}

CRITICAL EVALUATION CRITERIA:
⚠️ MANDATORY ZERO TOLERANCE POLICY: Empty, very short (under 25 characters), or placeholder answers MUST result in automatic failure.
⚠️ STRICT REQUIREMENT: If a candidate provided no substantial answers, this indicates they clicked through without engaging - score 0-15 maximum.
⚠️ CODING INTERVIEWS: Must contain actual code implementations with logic, not just explanations or single words.
⚠️ AUTOMATIC FAIL CONDITIONS: If most answers are empty, very short, or just contain starter template code without actual implementation.

Please provide a comprehensive evaluation including:

1. OVERALL SCORE (0-100): 
   - Empty/no answers: 0-5 points
   - Minimal text (under 25 chars each): 6-15 points
   - Brief placeholder text without code (25-50 chars): 16-25 points  
   - Incomplete attempts with minimal code (50+ chars): 26-45 points
   - Partial working solutions with some logic: 46-69 points
   - Good technical solutions with proper reasoning: 70-85 points
   - Excellent comprehensive solutions: 86-100 points

2. PASS/FAIL DECISION: 
   - Pass = 70+ score AND meaningful code solutions provided AND at least 80% questions attempted with substantial answers
   - Fail = below 70 OR mostly empty/minimal/placeholder answers OR less than 60% questions attempted meaningfully

3. STRENGTHS: Specific positive aspects of the performance
4. AREAS FOR IMPROVEMENT: Specific weaknesses or gaps identified  
5. STUDY RECOMMENDATIONS: Concrete topics and resources to focus on
6. INTERVIEW FEEDBACK: Communication style, structure of responses, etc.

MANDATORY FAILURE CONDITIONS:
- If most answers are empty, very short, or contain only placeholders: AUTOMATIC FAIL with score 0-20
- If answers show no actual coding attempt: AUTOMATIC FAIL
- If answers are just single words or brief explanations without code: AUTOMATIC FAIL

SPECIAL CONSIDERATIONS:
- If most answers are empty or very short, explicitly state this indicates the candidate didn't seriously attempt the interview
- Be constructive but honest about performance gaps
- Provide specific, actionable feedback for improvement

Format your response clearly starting with:
SCORE: [number]/100
STATUS: [PASS/FAIL]
[Rest of evaluation]`;

        // Get selected model or use available model
        let modelName = data.selectedModel;
        
        if (!modelName) {
            // Fallback to first available model
            const config = getProviderConfig(currentAIProvider);
            const modelsUrl = buildApiUrl(currentAIProvider, config.modelsPath);
            const headers = buildHeaders(currentAIProvider);
            
            const modelsResponse = await axios.get(modelsUrl, {
                timeout: 5000,
                headers: headers
            });
            
            if (currentAIProvider === 'ollama') {
                modelName = modelsResponse.data.models?.[0]?.name || config.defaultModel;
            } else if (currentAIProvider === 'openai') {
                modelName = config.defaultModel;
            } else { // lmstudio
                modelName = modelsResponse.data.data?.[0]?.id || 'local-model';
            }
        }
        
        console.log(`🤖 Using AI model for evaluation: ${modelName} via ${getProviderConfig(currentAIProvider).name}`);

        const messages = [
            {
                role: 'system',
                content: 'You are a senior technical interviewer and career coach with expertise in evaluating technical interviews. You provide honest, constructive feedback that helps candidates improve while being encouraging and specific.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        // Use the new AI provider system
        const evaluation = await makeAIRequest(messages, modelName, currentAIProvider);
        return { success: true, evaluation: evaluation, modelUsed: modelName, provider: getProviderConfig(currentAIProvider).name };
    } catch (error) {
        console.error('AI Evaluation Error:', error);
        const config = getProviderConfig(currentAIProvider);
        const errorMessage = error.code === 'ECONNREFUSED' 
            ? `Cannot connect to ${config.name} for evaluation`
            : `Evaluation Error: ${error.message}`;
            
        return { 
            success: false, 
            error: errorMessage,
            fallbackEvaluation: generateFallbackEvaluation(data)
        };
    }
});

function extractJobTitle(jobDescription) {
    // Try to extract job title from the description
    const lines = jobDescription.split('\n');
    for (let line of lines) {
        if (line.toLowerCase().includes('job title:') || line.toLowerCase().includes('position:')) {
            return line.split(':')[1]?.trim() || 'Software Developer';
        }
        if (line.toLowerCase().includes('developer') || line.toLowerCase().includes('engineer')) {
            return line.trim();
        }
    }
    return 'Software Developer';
}

function generateFallbackQuestions(data) {
    const jobTitle = extractJobTitle(data.jobDescription);
    const questionCount = data.questionCount || 5;
    const language = data.programmingLanguage || 'python';
    const interviewType = data.interviewType || 'coding';
    
    const languageMap = {
        'javascript': 'JavaScript',
        'typescript': 'TypeScript', 
        'python': 'Python',
        'java': 'Java',
        'csharp': 'C#',
        'cpp': 'C++',
        'go': 'Go',
        'rust': 'Rust',
        'php': 'PHP',
        'ruby': 'Ruby',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'scala': 'Scala',
        'sql': 'SQL'
    };
    
    const languageName = languageMap[language] || 'Python';
    
    if (interviewType === 'coding') {
        const codingChallenges = [
            {
                title: "Two Sum Problem",
                description: "finds two numbers in an array that add up to a target sum",
                example: "Input: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] (indices of 2 and 7)",
                complexity: "O(n) time, O(n) space using hash map"
            },
            {
                title: "Valid Parentheses",
                description: "determines if a string of parentheses is properly balanced",
                example: "Input: s = '()[]{}'\nOutput: true",
                complexity: "O(n) time, O(n) space using stack"
            },
            {
                title: "Reverse Linked List",
                description: "reverses a singly linked list iteratively",
                example: "Input: 1->2->3->4->5\nOutput: 5->4->3->2->1",
                complexity: "O(n) time, O(1) space"
            },
            {
                title: "Maximum Subarray",
                description: "finds the contiguous subarray with the largest sum (Kadane's algorithm)",
                example: "Input: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6 (subarray [4,-1,2,1])",
                complexity: "O(n) time, O(1) space"
            },
            {
                title: "Binary Search",
                description: "implements binary search on a sorted array",
                example: "Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4 (index of target)",
                complexity: "O(log n) time, O(1) space"
            },
            {
                title: "Merge Two Sorted Lists",
                description: "merges two sorted linked lists into one sorted list",
                example: "Input: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]",
                complexity: "O(n + m) time, O(1) space"
            },
            {
                title: "Contains Duplicate",
                description: "determines if an array contains any duplicate values",
                example: "Input: nums = [1,2,3,1]\nOutput: true",
                complexity: "O(n) time, O(n) space using set"
            },
            {
                title: "Best Time to Buy and Sell Stock",
                description: "finds the maximum profit from buying and selling a stock once",
                example: "Input: prices = [7,1,5,3,6,4]\nOutput: 5 (buy at 1, sell at 6)",
                complexity: "O(n) time, O(1) space"
            },
            {
                title: "Valid Anagram",
                description: "determines if two strings are anagrams of each other",
                example: "Input: s = 'anagram', t = 'nagaram'\nOutput: true",
                complexity: "O(n) time, O(1) space (26 letters)"
            },
            {
                title: "Climbing Stairs",
                description: "calculates number of ways to reach the top of n stairs (taking 1 or 2 steps)",
                example: "Input: n = 3\nOutput: 3 (ways: 1+1+1, 1+2, 2+1)",
                complexity: "O(n) time, O(1) space using dynamic programming"
            }
        ];
        
        const selectedChallenges = codingChallenges.slice(0, questionCount);
        
        return `ALGORITHMIC CODING CHALLENGES for ${jobTitle} (${languageName}):

${selectedChallenges.map((challenge, i) => `
**Problem ${i + 1}: ${challenge.title}**

Write a function that ${challenge.description}.

${challenge.example}

Expected Complexity: ${challenge.complexity}

Requirements:
- Implement your solution in ${languageName}
- Consider edge cases (empty input, single element, etc.)
- Optimize for the expected time/space complexity
- Write clean, readable code with meaningful variable names
- Test your solution with the provided example
`).join('\n')}

⚠️ Note: These are verified algorithmic challenges designed to test your coding skills.
Each problem focuses on fundamental algorithms and data structures commonly asked in technical interviews.

Duration: ${data.duration} minutes
Focus: Algorithms, data structures, and problem-solving
Interview Type: Coding Challenges

Tips:
- Start with brute force, then optimize
- Think about edge cases before coding
- Explain your approach before implementing
- Test with provided examples`;
    } else {
        const theoreticalQuestions = [
            "Explain the differences between different data structures (arrays, linked lists, hash tables, trees).",
            "What is time and space complexity? Explain Big O notation with examples.",
            "Describe object-oriented programming principles (encapsulation, inheritance, polymorphism).",
            "How would you approach debugging a performance issue in an application?",
            "Explain the difference between SQL and NoSQL databases. When would you use each?",
            "What are design patterns? Describe a few common ones and when to use them.",
            "How do you ensure code quality and maintainability in your projects?",
            "What is the difference between synchronous and asynchronous programming?",
            "Explain version control concepts and Git workflow best practices.",
            "How would you approach testing in software development? Different types of testing?"
        ];
        
        const selectedQuestions = theoreticalQuestions.slice(0, questionCount);
        
        return `Fallback Technical Questions for ${jobTitle} (${languageName}):

${selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}

Note: These are general technical questions. For AI-generated questions tailored to your CV and job description, please ensure LM Studio is running with a loaded model on 127.0.0.1:1234.

Duration: ${data.duration} minutes
Interview Type: ${interviewType}
Focus Areas: ${data.additionalDetails || 'Core programming concepts'}`;
    }
}

function generateFallbackEvaluation(data) {
    const answeredCount = data.answers ? data.answers.filter(answer => answer && answer.trim()).length : 0;
    const totalQuestions = Array.isArray(data.questions) ? data.questions.length : 5;
    const completionRate = Math.round((answeredCount / totalQuestions) * 100);
    
    // STRICT evaluation - check for meaningful answers (minimum 25 characters)
    const meaningfulAnswers = data.answers ? data.answers.filter(answer => {
        if (!answer || !answer.trim()) return false;
        const trimmed = answer.trim();
        // Must be at least 25 characters and not just placeholder text
        if (trimmed.length < 25) return false;
        // Reject common placeholders and minimal responses
        const placeholders = [
            'your code here', 'todo', 'implement', 'solution goes here', '// comment',
            'function', 'def ', 'return', 'print', 'console.log', 'pass', 'break',
            'continue', 'null', 'undefined', 'true', 'false', '{}', '[]', '()', ';'
        ];
        const lowerAnswer = trimmed.toLowerCase();
        
        // Check if answer is mostly placeholder text
        const hasPlaceholderContent = placeholders.some(placeholder => 
            lowerAnswer.includes(placeholder.toLowerCase())
        );
        
        // Require actual logic/code structure, not just single statements
        const hasCodeStructure = /[{}()\[\]]/g.test(trimmed) && trimmed.length > 40;
        const hasMultipleLines = trimmed.split('\n').length > 2;
        
        // Must have substantial length AND either code structure OR multiple lines AND NOT be mostly placeholders
        return trimmed.length >= 25 && (hasCodeStructure || hasMultipleLines) && 
               !hasPlaceholderContent;
    }) : [];
    
    const meaningfulCount = meaningfulAnswers.length;
    const meaningfulRate = Math.round((meaningfulCount / totalQuestions) * 100);
    
    // Calculate quality score based on meaningful answer length and content
    let qualityScore = 0;
    if (meaningfulAnswers.length > 0) {
        const avgLength = meaningfulAnswers.reduce((sum, answer) => sum + answer.trim().length, 0) / meaningfulAnswers.length;
        // Minimum meaningful answer should be at least 80 characters for decent score
        qualityScore = Math.min(100, Math.max(0, (avgLength / 150) * 100));
    }
    
    // ULTRA STRICT scoring: Zero tolerance for clicking through
    let finalScore = 0;
    let status = 'FAIL';
    
    if (meaningfulCount === 0) {
        // No meaningful answers = automatic zero
        finalScore = 0;
        status = 'FAIL';
    } else if (answeredCount < totalQuestions * 0.6) {
        // Less than 60% questions attempted = very low score
        finalScore = Math.min(15, answeredCount * 3);
        status = 'FAIL';
    } else if (meaningfulRate < 60) {
        // Less than 60% meaningful completion = low score  
        finalScore = Math.min(20, meaningfulRate * 0.3);
        status = 'FAIL';
    } else if (meaningfulRate < 80) {
        // 60-79% completion = medium-low score
        finalScore = Math.min(45, 25 + (meaningfulRate - 60) * 1.0);
        status = 'FAIL';
    } else {
        // 80%+ completion with strict quality check
        const baseScore = 50 + (meaningfulRate - 80) * 1.0; // 50-70 base
        finalScore = Math.min(75, Math.round(baseScore * (qualityScore / 100))); // Apply quality modifier, cap at 75 for fallback
        status = finalScore >= 70 ? 'PASS' : 'FAIL'; // STRICT: Need 70+ to pass AND this is capped at 75 for manual review
    }
    
    finalScore = Math.round(finalScore);
    
    return `FALLBACK EVALUATION REPORT

⚠️ AI Evaluation Not Available
This is a basic assessment. For detailed AI-powered evaluation, please ensure LM Studio is running.

COMPLETION STATISTICS:
- Questions Answered: ${answeredCount} out of ${totalQuestions} (${completionRate}%)
- Meaningful Answers: ${meaningfulCount} out of ${totalQuestions} (${meaningfulRate}%)
- Average Answer Quality: ${Math.round(qualityScore)}%
- Time Used: ${data.duration}

STRICT ASSESSMENT:
Score: ${finalScore}/100
Status: ${status}
⚠️ Note: Fallback evaluation caps scores at 75. Use AI evaluation for full assessment.

${meaningfulCount === 0 ? 
    '🚨 AUTOMATIC FAILURE: No meaningful answers detected. Clicking "Next" through questions without writing actual code solutions results in automatic failure with zero score.' :
    answeredCount < totalQuestions * 0.6 ?
    '🚨 INSUFFICIENT EFFORT: Less than 60% of questions were attempted. This demonstrates inadequate effort and results in automatic failure.' :
    meaningfulCount < totalQuestions * 0.6 ?
    '🚨 NO SUBSTANTIAL CODE: While some text was entered, less than 60% contained meaningful code solutions. Simply typing brief text without actual programming logic results in failure.' :
    finalScore < 70 ?
    '❌ BELOW PASSING: While some effort was shown, the responses lack the depth and code quality expected for a passing grade. Actual working code implementations are required.' :
    '✅ MEETS MINIMUM REQUIREMENTS: Basic coding competency demonstrated. However, use AI evaluation for detailed feedback and full scoring potential.'
}

DETAILED ANALYSIS:
${answeredCount === 0 ? 
    '🚨 ZERO ENGAGEMENT: No answers were provided to any questions. This suggests you may have clicked through the interview without actually attempting to solve the problems. For meaningful interview practice, you must write actual code solutions.' :
    meaningfulCount === 0 ?
    '🚨 NO MEANINGFUL CODE: While you may have typed some text, none of your responses contained substantial code solutions. Effective interview preparation requires writing actual algorithm implementations.' :
    answeredCount < totalQuestions ?
    `⚠️ INCOMPLETE PARTICIPATION: Only answered ${answeredCount} out of ${totalQuestions} questions. Time management and completing all questions is crucial in real interviews.` :
    '✅ All questions were attempted.'
}

${qualityScore < 30 ?
    '❌ ANSWER QUALITY: Responses appear too brief or lack substantial code. Provide detailed implementations with proper logic and syntax.' :
    qualityScore < 60 ?
    '⚠️ ANSWER QUALITY: Answers could be more comprehensive. Include complete function implementations and explain your approach.' :
    '✅ Answer quality shows reasonable effort and detail.'
}

MANDATORY IMPROVEMENTS BEFORE RETAKING:
1. ${meaningfulCount === 0 ? 'Actually write code solutions instead of clicking through' : 'Focus on providing complete, working code implementations'}
2. ${answeredCount < totalQuestions ? 'Complete ALL questions within the time limit' : 'Improve code quality and add proper comments'}
3. Practice fundamental algorithms: arrays, strings, loops, conditionals
4. Study data structures: arrays, objects, linked lists, trees
5. Time management: allocate time to attempt every question

STUDY RECOMMENDATIONS:
1. ${meaningfulCount === 0 ? 'Start with basic coding tutorials and simple algorithm problems' : 'Review fundamental concepts for the technologies mentioned in the job description'}
2. Practice explaining your thought process clearly and concisely
3. Work on coding problems to improve problem-solving speed
4. Study system design patterns if applying for senior roles
5. Practice mock interviews to improve confidence and timing

CRITICAL FEEDBACK:
${meaningfulCount === 0 ? 
    '🚨 URGENT: Simply clicking "Next" through questions without answering will not help your interview preparation. Please retake the interview and provide actual responses to each question. Real interviewers expect to see your problem-solving approach and code implementations.' :
    finalScore < 50 ?
    '⚠️ Your current performance suggests significant preparation is needed before real interviews. Focus on fundamentals and practice basic coding problems daily.' :
    finalScore < 70 ?
    '⚠️ You\'re showing effort but need improvement to meet interview standards. Practice more complex problems and focus on code quality.' :
    '✅ Basic competency demonstrated. Continue practicing to build confidence and improve performance.'
}

For detailed, personalized feedback with specific code review:
1. Install LM Studio from https://lmstudio.ai
2. Load a suitable language model (7B+ parameters recommended)  
3. Start the server on 127.0.0.1:1234
4. Retake the interview for AI-powered evaluation with specific suggestions`;
}

// AI Provider Helper Functions
function getProviderConfig(providerId = currentAIProvider) {
    return AI_PROVIDERS[providerId] || AI_PROVIDERS.lmstudio;
}

function buildApiUrl(providerId, endpoint) {
    const config = getProviderConfig(providerId);
    return `${config.baseUrl}${endpoint}`;
}

function buildHeaders(providerId = currentAIProvider) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (providerId === 'openai' && aiApiKey) {
        headers['Authorization'] = `Bearer ${aiApiKey}`;
    }
    
    return headers;
}

function formatRequestForProvider(providerId, messages, model) {
    const config = getProviderConfig(providerId);
    
    switch (providerId) {
        case 'ollama':
            return {
                model: model || config.defaultModel,
                messages: messages,
                stream: false
            };
        case 'openai':
        case 'lmstudio':
        default:
            return {
                model: model || config.defaultModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
    }
}

function parseResponseFromProvider(providerId, response) {
    switch (providerId) {
        case 'ollama':
            return response.data.message?.content || '';
        case 'openai':
        case 'lmstudio':
        default:
            return response.data.choices?.[0]?.message?.content || '';
    }
}

async function makeAIRequest(messages, model = null, providerId = currentAIProvider) {
    const config = getProviderConfig(providerId);
    const url = buildApiUrl(providerId, config.apiPath);
    const headers = buildHeaders(providerId);
    const requestPayload = formatRequestForProvider(providerId, messages, model);
    
    console.log(`🤖 Making AI request to ${config.name}:`, url);
    console.log('📋 Request payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await axios.post(url, requestPayload, {
        headers: headers,
        timeout: 60000
    });
    
    return parseResponseFromProvider(providerId, response);
}

app.whenReady().then(createMainWindow);

//# sourceMappingURL=main.js.map
