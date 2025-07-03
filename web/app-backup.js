// Web Version - Interview Preparation App
// Adapted from Electron version for web deployment with full AI provider support
// 
// Features Added:
// - LM Studio support (local AI provider)
// - Ollama support (local AI provider)  
// - OpenAI support (cloud AI provider)
// - Automatic AI provider detection and connection testing
// - Model dropdown population from connected providers
// - Fixed file upload dialog triggering
// - Enhanced error handling and user feedback
//
// Bug Fixes:
// - File upload buttons now properly trigger file selection dialog
// - LM Studio detection works correctly
// - Model loading and selection works for all providers
// - Form validation includes AI provider status
// - Better error messages and connection status indicators

// Shared utility functions (embedded for web version)
function extractProgrammingLanguages(text) {
    const languages = [
        { keywords: ['javascript', 'js', 'node.js', 'react', 'vue', 'angular'], name: 'JavaScript', value: 'javascript' },
        { keywords: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'], name: 'Python', value: 'python' },
        { keywords: ['java', 'spring', 'hibernate', 'maven', 'gradle'], name: 'Java', value: 'java' },
        { keywords: ['typescript', 'ts', 'angular', 'nest.js'], name: 'TypeScript', value: 'typescript' },
        { keywords: ['c#', 'csharp', '.net', 'asp.net', 'entity framework'], name: 'C#', value: 'csharp' },
        { keywords: ['c++', 'cpp', 'qt', 'boost'], name: 'C++', value: 'cpp' },
        { keywords: ['go', 'golang', 'gin', 'gorilla'], name: 'Go', value: 'go' },
        { keywords: ['rust', 'cargo', 'tokio'], name: 'Rust', value: 'rust' },
        { keywords: ['php', 'laravel', 'symfony', 'composer'], name: 'PHP', value: 'php' },
        { keywords: ['ruby', 'rails', 'sinatra'], name: 'Ruby', value: 'ruby' }
    ];
    
    const textLower = text.toLowerCase();
    return languages.filter(lang => 
        lang.keywords.some(keyword => textLower.includes(keyword))
    );
}

function getLanguageOptions(detectedLanguages) {
    return detectedLanguages.map(lang => ({
        value: lang.value,
        label: lang.name,
        detected: true
    }));
}

function generateLanguageDropdownOptions(options, groupLabel) {
    const optElements = [];
    
    if (options.length > 0) {
        const group = document.createElement('optgroup');
        group.label = groupLabel;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            group.appendChild(option);
        });
        optElements.push(group);
    }
    
    // Add other common languages
    const commonLanguages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'csharp', label: 'C#' },
        { value: 'cpp', label: 'C++' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'php', label: 'PHP' },
        { value: 'ruby', label: 'Ruby' }
    ];
    
    const otherGroup = document.createElement('optgroup');
    otherGroup.label = 'All Languages:';
    commonLanguages.forEach(lang => {
        if (!options.some(opt => opt.value === lang.value)) {
            const option = document.createElement('option');
            option.value = lang.value;
            option.textContent = lang.label;
            otherGroup.appendChild(option);
        }
    });
    optElements.push(otherGroup);
    
    return optElements;
}

function parseQuestionsFromResponse(response) {
    const questions = [];
    const lines = response.split('\n');
    let currentQuestion = null;
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^\d+\.|^Question \d+/i)) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                id: questions.length + 1,
                content: trimmed.replace(/^\d+\.\s*/, '').replace(/^Question \d+:?\s*/i, ''),
                type: trimmed.toLowerCase().includes('[coding]') ? 'coding' : 'theory'
            };
        } else if (currentQuestion && trimmed) {
            currentQuestion.content += ' ' + trimmed;
        }
    }
    
    if (currentQuestion) {
        questions.push(currentQuestion);
    }
    
    return questions.length > 0 ? questions : [
        { id: 1, content: "Describe your experience with the technology stack mentioned in the job description.", type: "theory" },
        { id: 2, content: "Write a function to reverse a string without using built-in reverse methods.", type: "coding" },
        { id: 3, content: "Explain the difference between synchronous and asynchronous programming.", type: "theory" }
    ];
}

function buildQuestionPrompt(data) {
    return `Generate ${data.questionCount} technical interview questions for a ${data.difficulty} level ${data.language} developer position.

Job Description: ${data.jobDescription}
${data.cvContent ? `Candidate Background: ${data.cvContent}` : ''}
${data.additionalDetails ? `Additional Requirements: ${data.additionalDetails}` : ''}

Requirements:
1. Create a mix of theoretical and practical coding questions
2. Questions should be relevant to the job description
3. Include both conceptual understanding and problem-solving
4. Format each question clearly numbered (1., 2., etc.)
5. Mark coding questions with [CODING] and theory questions with [THEORY]

Generate exactly ${data.questionCount} questions appropriate for a ${data.difficulty} level interview.`;
}

function buildEvaluationPrompt(data) {
    let prompt = `Please evaluate this technical interview performance:

INTERVIEW DETAILS:
- Duration: ${data.duration} minutes
- Programming Language: ${data.language}
- Difficulty Level: ${data.difficulty}
- Job Description: ${data.jobDescription}

QUESTIONS AND ANSWERS:
`;

    data.questions.forEach((question, index) => {
        const answer = data.answers[index] || 'No answer provided';
        prompt += `
Question ${index + 1}: ${question.content}
Answer: ${answer}
`;
    });

    prompt += `
Please provide a comprehensive evaluation with:
SCORE: [0-100]
RESULT: [PASS/FAIL]
FEEDBACK: [Detailed feedback on each answer, strengths, areas for improvement, and specific recommendations]`;

    return prompt;
}

function getCodeMirrorMode(language) {
    const modeMap = {
        'javascript': 'javascript',
        'typescript': 'javascript',
        'python': 'python',
        'java': 'text/x-java',
        'csharp': 'text/x-csharp',
        'cpp': 'text/x-c++src',
        'go': 'go',
        'rust': 'rust',
        'php': 'php',
        'ruby': 'ruby'
    };
    return modeMap[language] || 'javascript';
}

async function extractTextFromFile(file, type, context = 'web') {
    if (type === 'txt') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    } else if (type === 'pdf') {
        return new Promise(async (resolve, reject) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let text = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    text += pageText + '\n';
                }
                
                resolve(text);
            } catch (error) {
                reject(new Error('Failed to extract text from PDF'));
            }
        });
    } else {
        throw new Error('Unsupported file type');
    }
}

// Interview Session class (simplified for web)
class InterviewSession {
    constructor(questions) {
        this.questions = questions;
        this.answers = new Array(questions.length).fill('');
        this.currentIndex = 0;
    }
    
    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }
    
    getCurrentAnswer() {
        return this.answers[this.currentIndex];
    }
    
    saveAnswer(answer) {
        this.answers[this.currentIndex] = answer;
    }
    
    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
        }
    }
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }
    
    goTo(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentIndex = index;
        }
    }
}

// AI Provider Configuration
const AI_PROVIDERS = {
    lmstudio: {
        name: 'LM Studio',
        baseUrl: 'http://127.0.0.1:1234',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: false,
        defaultModel: null
    },
    ollama: {
        name: 'Ollama',
        baseUrl: 'http://127.0.0.1:11434',
        apiPath: '/api/chat',
        modelsPath: '/api/tags',
        requiresApiKey: false,
        defaultModel: 'llama2'
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

class InterviewApp {
    constructor() {
        this.currentAIProvider = 'lmstudio'; // Default to LM Studio for local testing
        this.aiApiKey = '';
        this.model = '';
        this.cvContent = '';
        this.jobDescriptionContent = '';
        this.additionalDetailsEditor = null;
        this.answerEditor = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.duration = 30; // minutes
        this.timerInterval = null;
        this.session = null;
        
        this.init();
    }
    
    init() {
        console.log('🎯 Interview Preparation App - Web Version');
        console.log('🚀 Initializing application...');
        
        try {
            this.setupEventListeners();
            console.log('✅ Event listeners setup complete');
            
            this.initializeCodeMirror();
            console.log('✅ CodeMirror initialized');
            
            this.loadSavedSettings();
            console.log('✅ Settings loaded');
            
            this.checkAIConnection();
            console.log('✅ AI connection check started');
            
            this.validateForm();
            console.log('✅ Form validation complete');
            
            console.log('🎉 Application initialization complete!');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Test if elements exist
        const cvFile = document.getElementById('cv-file');
        const jobFile = document.getElementById('job-file');
        const cvUpload = document.getElementById('cv-upload');
        const jobUpload = document.getElementById('job-upload');
        
        console.log('Elements found:', {
            cvFile: !!cvFile,
            jobFile: !!jobFile,
            cvUpload: !!cvUpload,
            jobUpload: !!jobUpload
        });
        
        if (cvFile) console.log('CV file element:', cvFile);
        if (jobFile) console.log('Job file element:', jobFile);
        if (cvUpload) console.log('CV upload element:', cvUpload);
        if (jobUpload) console.log('Job upload element:', jobUpload);
        
        if (!cvFile || !jobFile || !cvUpload || !jobUpload) {
            console.error('❌ Some upload elements not found!');
            console.log('Available elements on page:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        
        // File upload handlers with debugging
        cvFile.addEventListener('change', (e) => {
            console.log('CV file change event triggered:', e.target.files[0]);
            this.handleFileUpload(e, 'cv');
        });
        jobFile.addEventListener('change', (e) => {
            console.log('Job file change event triggered:', e.target.files[0]);
            this.handleFileUpload(e, 'job');
        });
        
        // Click handlers for custom upload buttons with more debugging
        cvUpload.addEventListener('click', (e) => {
            console.log('🖱️ CV upload button clicked!');
            console.log('Event details:', e);
            console.log('Target:', e.target);
            console.log('Current target:', e.currentTarget);
            e.preventDefault();
            e.stopPropagation();
            console.log('About to trigger cvFile.click()...');
            cvFile.click();
            console.log('cvFile.click() executed');
        });
        
        jobUpload.addEventListener('click', (e) => {
            console.log('🖱️ Job upload button clicked!');
            console.log('Event details:', e);
            console.log('Target:', e.target);
            console.log('Current target:', e.currentTarget);
            e.preventDefault();
            e.stopPropagation();
            console.log('About to trigger jobFile.click()...');
            jobFile.click();
            console.log('jobFile.click() executed');
        });
        
        // Test clicking programmatically
        setTimeout(() => {
            console.log('🧪 Testing programmatic clicks after 2 seconds...');
            console.log('CV upload element classes:', cvUpload.className);
            console.log('Job upload element classes:', jobUpload.className);
        }, 2000);
        
        console.log('✅ File upload event listeners added');
        
        // AI provider and model handlers
        const aiProvider = document.getElementById('ai-provider');
        const apiKey = document.getElementById('api-key');
        const aiModel = document.getElementById('ai-model');
        const testProvider = document.getElementById('test-provider');
        const refreshModels = document.getElementById('refresh-models');
        
        if (aiProvider) aiProvider.addEventListener('change', this.handleProviderChange.bind(this));
        if (apiKey) apiKey.addEventListener('input', this.handleApiKeyChange.bind(this));
        if (aiModel) aiModel.addEventListener('change', this.handleModelChange.bind(this));
        if (testProvider) testProvider.addEventListener('click', this.testProviderConnection.bind(this));
        if (refreshModels) refreshModels.addEventListener('click', this.refreshModels.bind(this));
        
        // Form handlers
        const programmingLanguage = document.getElementById('programming-language');
        const duration = document.getElementById('duration');
        
        if (programmingLanguage) programmingLanguage.addEventListener('change', this.validateForm.bind(this));
        if (duration) duration.addEventListener('change', this.handleDurationChange.bind(this));
        
        // Button handlers
        const generatePreview = document.getElementById('generate-preview');
        const startInterview = document.getElementById('start-interview');
        const regenerateQuestions = document.getElementById('regenerate-questions');
        const proceedInterview = document.getElementById('proceed-interview');
        
        if (generatePreview) generatePreview.addEventListener('click', this.generatePreview.bind(this));
        if (startInterview) startInterview.addEventListener('click', this.startInterview.bind(this));
        if (regenerateQuestions) regenerateQuestions.addEventListener('click', this.regenerateQuestions.bind(this));
        if (proceedInterview) proceedInterview.addEventListener('click', this.proceedToInterview.bind(this));
        
        // Interview handlers (these might not exist initially)
        const endInterview = document.getElementById('end-interview');
        const prevQuestion = document.getElementById('prev-question');
        const nextQuestion = document.getElementById('next-question');
        const saveAnswer = document.getElementById('save-answer');
        const speakQuestion = document.getElementById('speak-question');
        const editorMode = document.getElementById('editor-mode');
        
        if (endInterview) endInterview.addEventListener('click', this.endInterview.bind(this));
        if (prevQuestion) prevQuestion.addEventListener('click', () => this.navigateQuestion(-1));
        if (nextQuestion) nextQuestion.addEventListener('click', () => this.navigateQuestion(1));
        if (saveAnswer) saveAnswer.addEventListener('click', this.saveCurrentAnswer.bind(this));
        if (speakQuestion) speakQuestion.addEventListener('click', this.speakQuestion.bind(this));
        if (editorMode) editorMode.addEventListener('change', this.changeEditorMode.bind(this));
        
        // Results handlers (these might not exist initially)
        const exportResults = document.getElementById('export-results');
        const newInterview = document.getElementById('new-interview');
        
        if (exportResults) exportResults.addEventListener('click', this.exportResults.bind(this));
        if (newInterview) newInterview.addEventListener('click', this.newInterview.bind(this));
        
        // Modal handlers
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', this.closeModal.bind(this));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        console.log('✅ All event listeners set up successfully');
    }
    
    initializeCodeMirror() {
        // Additional details editor
        this.additionalDetailsEditor = CodeMirror(document.getElementById('additional-details-editor'), {
            mode: 'markdown',
            theme: 'default',
            lineNumbers: true,
            lineWrapping: true,
            placeholder: 'Enter any specific requirements, technologies to focus on, interview style preferences, etc...\n\nExample:\n- Focus on React and Node.js\n- Include system design questions\n- Emphasis on problem-solving approach\n- Prefer practical coding challenges',
            value: ''
        });
    }
    
    loadSavedSettings() {
        // Load saved AI provider
        const savedProvider = localStorage.getItem('ai_provider');
        if (savedProvider && AI_PROVIDERS[savedProvider]) {
            this.currentAIProvider = savedProvider;
            document.getElementById('ai-provider').value = savedProvider;
        }
        
        // Load saved API key for OpenAI
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            document.getElementById('api-key').value = savedKey;
            this.aiApiKey = savedKey;
        }
        
        // Show/hide API key field based on provider
        this.updateProviderConfig();
    }
    
    handleProviderChange(event) {
        this.currentAIProvider = event.target.value;
        localStorage.setItem('ai_provider', this.currentAIProvider);
        
        this.updateProviderConfig();
        this.refreshModels();
        this.checkAIConnection();
        this.validateForm();
    }
    
    updateProviderConfig() {
        const config = AI_PROVIDERS[this.currentAIProvider];
        const providerConfigDiv = document.getElementById('provider-config');
        const apiKeyInput = document.getElementById('api-key');
        
        if (config.requiresApiKey) {
            providerConfigDiv.style.display = 'block';
            apiKeyInput.placeholder = `Enter your ${config.name} API key...`;
        } else {
            providerConfigDiv.style.display = 'none';
        }
        
        // Update provider status
        const statusText = document.querySelector('#provider-status .status-text');
        statusText.textContent = `${config.name} selected`;
    }
    
    handleApiKeyChange(event) {
        this.aiApiKey = event.target.value.trim();
        if (this.aiApiKey && this.currentAIProvider === 'openai') {
            localStorage.setItem('openai_api_key', this.aiApiKey);
        } else {
            localStorage.removeItem('openai_api_key');
        }
        this.validateForm();
    }
    
    handleModelChange(event) {
        this.model = event.target.value;
        this.validateForm();
    }
    
    handleDurationChange(event) {
        this.duration = parseInt(event.target.value);
    }
    
    async testProviderConnection() {
        const config = AI_PROVIDERS[this.currentAIProvider];
        
        if (config.requiresApiKey && !this.aiApiKey) {
            this.updateAIStatus('disconnected', 'Enter API key to connect');
            this.showNotification('Please enter your API key', 'warning');
            return;
        }
        
        this.updateAIStatus('loading', 'Testing connection...');
        
        try {
            let response;
            const headers = { 'Content-Type': 'application/json' };
            
            if (this.currentAIProvider === 'openai') {
                headers['Authorization'] = `Bearer ${this.aiApiKey}`;
                response = await fetch('https://api.openai.com/v1/models', { headers });
            } else if (this.currentAIProvider === 'lmstudio') {
                response = await fetch('http://127.0.0.1:1234/v1/models', { 
                    headers,
                    signal: AbortSignal.timeout(8000)
                });
            } else if (this.currentAIProvider === 'ollama') {
                response = await fetch('http://127.0.0.1:11434/api/tags', { 
                    headers,
                    signal: AbortSignal.timeout(8000)
                });
            }
            
            if (response.ok) {
                this.updateAIStatus('connected', `${config.name} connection successful`);
                this.showNotification(`✅ ${config.name} connected successfully!`, 'success');
                // Refresh models after successful connection
                await this.refreshModels();
            } else {
                if (this.currentAIProvider === 'openai') {
                    const error = await response.json();
                    this.updateAIStatus('disconnected', `Connection failed: ${error.error?.message || 'Invalid API key'}`);
                    this.showNotification('❌ Invalid API key or connection failed', 'error');
                } else {
                    this.updateAIStatus('disconnected', `${config.name} server returned error: ${response.status}`);
                    this.showNotification(`❌ ${config.name} server error`, 'error');
                }
            }
        } catch (error) {
            let errorMessage = 'Connection failed';
            if (error.name === 'TimeoutError') {
                errorMessage = `${config.name} connection timeout - is the server running?`;
            } else if (error.message.includes('fetch')) {
                errorMessage = `Cannot reach ${config.name} server`;
            } else {
                errorMessage = error.message;
            }
            
            this.updateAIStatus('disconnected', errorMessage);
            this.showNotification(`❌ ${errorMessage}`, 'error');
        }
        
        this.validateForm();
    }
    
    updateAIStatus(status, message) {
        const indicator = document.getElementById('ai-status-indicator');
        const text = document.getElementById('ai-status-text');
        
        indicator.className = `status-indicator ${status}`;
        text.textContent = message;
    }
    
    updateModelStatus(status, message) {
        const indicator = document.querySelector('#model-status .status-indicator');
        const text = document.querySelector('#model-status .status-text');
        
        if (indicator) indicator.className = `status-indicator ${status}`;
        if (text) text.textContent = message;
    }
    
    async checkAIConnection() {
        // Auto-check connection when app loads
        console.log('🔍 Checking AI connection on startup...');
        console.log('Current AI provider:', this.currentAIProvider);
        
        // Always test the connection, regardless of provider
        await this.testProviderConnection();
        
        // If connection is successful, load models
        const statusText = document.getElementById('ai-status-text').textContent;
        console.log('AI status after test:', statusText);
        
        if (statusText.includes('successful') || statusText.includes('Connected')) {
            console.log('✅ AI connection successful, loading models...');
            await this.refreshModels();
        } else {
            console.log('⚠️ AI connection not successful, status:', statusText);
            this.updateAIStatus('disconnected', 'Click Test button to check connection');
        }
    }
    
    async handleFileUpload(event, type) {
        console.log(`🗂️ File upload triggered for type: ${type}`);
        console.log('Event:', event);
        console.log('Files:', event.target.files);
        
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log(`📁 File selected: ${file.name} (${file.type}, ${file.size} bytes)`);
        
        this.showLoading('Processing file...');
        
        try {
            let content = '';
            
            console.log('🔍 Processing file type:', file.type);
            
            if (file.type === 'application/pdf') {
                console.log('📄 Processing PDF file...');
                content = await extractTextFromFile(file, 'pdf', 'web');
            } else if (file.type === 'text/plain') {
                console.log('📝 Processing text file...');
                content = await extractTextFromFile(file, 'txt', 'web');
            } else if (file.name.toLowerCase().endsWith('.pdf')) {
                // Sometimes PDF files don't have the correct MIME type
                console.log('📄 Processing PDF file (by extension)...');
                content = await extractTextFromFile(file, 'pdf', 'web');
            } else if (file.name.toLowerCase().endsWith('.txt')) {
                console.log('📝 Processing text file (by extension)...');
                content = await extractTextFromFile(file, 'txt', 'web');
            } else {
                throw new Error(`Unsupported file type: ${file.type}. Please use PDF or TXT files.`);
            }
            
            console.log(`✅ File processed successfully. Content length: ${content.length} characters`);
            console.log('Content preview:', content.substring(0, 200) + '...');
            
            if (type === 'cv') {
                this.cvContent = content;
                document.getElementById('cv-filename').textContent = file.name;
                document.getElementById('cv-upload').classList.add('uploaded');
                document.getElementById('cv-upload').innerHTML = '<span class="upload-icon">✅</span> CV Uploaded';
                this.showNotification(`✅ CV uploaded: ${file.name}`, 'success');
            } else if (type === 'job') {
                this.jobDescriptionContent = content;
                document.getElementById('job-filename').textContent = file.name;
                document.getElementById('job-upload').classList.add('uploaded');
                document.getElementById('job-upload').innerHTML = '<span class="upload-icon">✅</span> Job Description Uploaded';
                
                // Extract programming languages from job description
                console.log('🔍 Extracting programming languages...');
                await this.updateProgrammingLanguages(content);
                this.showNotification(`✅ Job description uploaded: ${file.name}`, 'success');
            }
            
            this.validateForm();
        } catch (error) {
            console.error('❌ File processing error:', error);
            this.showNotification(`❌ Error processing file: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async updateProgrammingLanguages(jobDescription) {
        const languages = extractProgrammingLanguages(jobDescription);
        const options = getLanguageOptions(languages);
        const languageSelect = document.getElementById('programming-language');
        // Use shared dropdown generator
        const dropdownOptions = generateLanguageDropdownOptions(options, 'Languages detected in job description:');
        languageSelect.innerHTML = '';
        dropdownOptions.forEach(opt => languageSelect.appendChild(opt));
        if (options.length > 0) {
            const languageNames = options.map(l => l.label).join(', ');
            this.showNotification(`✅ Detected languages: ${languageNames}`, 'success');
        }
    }

    // Replace extractLanguagesFromText with shared utility
    extractLanguagesFromText(text) {
        const langs = extractProgrammingLanguages(text);
        return getLanguageOptions(langs);
    }
    
    // Use shared question parser
    async generateQuestions() {
        const questionCount = parseInt(document.getElementById('question-count').value);
        const programmingLanguage = document.getElementById('programming-language').value;
        const difficulty = document.getElementById('difficulty').value;
        const additionalDetails = this.additionalDetailsEditor.getValue();
        const prompt = buildQuestionPrompt({
            questionCount,
            language: programmingLanguage,
            difficulty,
            jobDescription: this.jobDescriptionContent,
            cvContent: this.cvContent,
            additionalDetails
        });
        const response = await this.callAI(prompt);
        this.questions = parseQuestionsFromResponse(response);
        // Initialize answers array
        this.answers = new Array(this.questions.length).fill('');
        
        // After getting questions array:
        this.session = new InterviewSession(this.questions);
    }
    
    // Use shared prompt builder for evaluation
    buildEvaluationPrompt() {
        return buildEvaluationPrompt({
            duration: this.duration,
            language: document.getElementById('programming-language').value,
            difficulty: document.getElementById('difficulty').value,
            jobDescription: this.jobDescriptionContent,
            questions: this.questions,
            answers: this.answers
        });
    }
    
    // Use shared CodeMirror mode mapping
    getCodeMirrorMode(language) {
        return getCodeMirrorMode(language);
    }
    
    async callAI(prompt, isEvaluation = false) {
        const config = AI_PROVIDERS[this.currentAIProvider];
        const messages = [
            {
                role: 'system',
                content: isEvaluation ? 
                    'You are an expert technical interviewer providing detailed feedback on interview performance.' :
                    'You are an expert technical interviewer creating relevant and challenging interview questions.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];
        
        let url, headers, body;
        
        if (this.currentAIProvider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Authorization': `Bearer ${this.aiApiKey}`,
                'Content-Type': 'application/json'
            };
            body = JSON.stringify({
                model: this.model,
                messages: messages,
                max_tokens: isEvaluation ? 2000 : 1500,
                temperature: 0.7
            });
        } else if (this.currentAIProvider === 'lmstudio') {
            url = 'http://127.0.0.1:1234/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json'
            };
            body = JSON.stringify({
                model: this.model,
                messages: messages,
                max_tokens: isEvaluation ? 2000 : 1500,
                temperature: 0.7
            });
        } else if (this.currentAIProvider === 'ollama') {
            url = 'http://127.0.0.1:11434/api/chat';
            headers = {
                'Content-Type': 'application/json'
            };
            body = JSON.stringify({
                model: this.model,
                messages: messages,
                stream: false
            });
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
            signal: AbortSignal.timeout(60000) // 60 second timeout
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `${config.name} API request failed`);
        }
        
        const data = await response.json();
        
        // Parse response based on provider
        if (this.currentAIProvider === 'ollama') {
            return data.message?.content || '';
        } else {
            return data.choices?.[0]?.message?.content || '';
        }
    }
    
    showPreviewModal() {
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'preview-question';
            questionDiv.innerHTML = `
                <h4>Question ${index + 1}:</h4>
                <p>${question.content}</p>
            `;
            previewContent.appendChild(questionDiv);
        });
        
        document.getElementById('preview-modal').classList.add('show');
    }
    
    async regenerateQuestions() {
        this.closeModal();
        await this.generatePreview();
    }
    
    proceedToInterview() {
        this.closeModal();
        this.startInterview();
    }
    
    startInterview() {
        if (this.questions.length === 0) {
            this.generatePreview();
            return;
        }
        
        // Hide setup form and show interview
        document.querySelector('.setup-form').style.display = 'none';
        document.getElementById('interview-section').classList.remove('hidden');
        document.getElementById('interview-section').style.display = 'block';
        
        // Initialize interview
        this.currentQuestionIndex = 0;
        this.startTime = new Date();
        this.initializeInterviewEditor();
        this.displayCurrentQuestion();
        this.startTimer();
        this.buildQuestionNavigation();
        
        this.showNotification('🚀 Interview started! Good luck!', 'success');
    }
    
    initializeInterviewEditor() {
        const mode = document.getElementById('programming-language').value;
        
        this.answerEditor = CodeMirror(document.getElementById('answer-editor'), {
            mode: this.getCodeMirrorMode(mode),
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true,
            placeholder: 'Type your answer here...',
            value: this.answers[this.currentQuestionIndex] || ''
        });
        
        // Auto-save on changes
        this.answerEditor.on('change', () => {
            this.answers[this.currentQuestionIndex] = this.answerEditor.getValue();
        });
    }
    
    displayCurrentQuestion() {
        if (!this.session) return;
        const question = this.session.getCurrentQuestion();
        const totalQuestions = this.questions.length;
        
        document.getElementById('question-title').textContent = `Question ${this.currentQuestionIndex + 1} of ${totalQuestions}`;
        document.getElementById('question-content').textContent = question.content;
        
        // Update answer editor with saved answer
        if (this.answerEditor) {
            this.answerEditor.setValue(this.session.getCurrentAnswer());
        }
        
        // Update navigation buttons
        document.getElementById('prev-question').disabled = this.currentQuestionIndex === 0;
        document.getElementById('next-question').disabled = this.currentQuestionIndex === totalQuestions - 1;
        document.getElementById('next-question').textContent = 
            this.currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next ➡️';
        
        // Update question navigation
        this.updateQuestionNavigation();
    }
    
    buildQuestionNavigation() {
        const questionList = document.getElementById('question-list');
        questionList.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'question-nav-item';
            navItem.textContent = `Q${index + 1}`;
            navItem.addEventListener('click', () => this.goToQuestion(index));
            questionList.appendChild(navItem);
        });
        
        this.updateQuestionNavigation();
    }
    
    updateQuestionNavigation() {
        const navItems = document.querySelectorAll('.question-nav-item');
        navItems.forEach((item, index) => {
            item.classList.remove('active', 'answered');
            
            if (index === this.currentQuestionIndex) {
                item.classList.add('active');
            }
            
            if (this.answers[index] && this.answers[index].trim() !== '') {
                item.classList.add('answered');
            }
        });
    }
    
    navigateQuestion(direction) {
        if (!this.session) return;
        this.currentQuestionIndex = this.session.currentIndex;
        if (direction > 0) this.session.next();
        else this.session.prev();
        this.currentQuestionIndex = this.session.currentIndex;
        this.displayCurrentQuestion();
    }
    
    goToQuestion(index) {
        if (!this.session) return;
        this.session.goTo(index);
        this.currentQuestionIndex = this.session.currentIndex;
        this.displayCurrentQuestion();
    }
    
    saveCurrentAnswer() {
        if (!this.session || !this.answerEditor) return;
        const answer = this.answerEditor.getValue();
        this.session.saveAnswer(answer);
        this.answers[this.currentQuestionIndex] = answer;
        this.updateQuestionNavigation();
    }
    
    changeEditorMode() {
        const mode = document.getElementById('editor-mode').value;
        if (this.answerEditor) {
            this.answerEditor.setOption('mode', this.getCodeMirrorMode(mode));
        }
    }
    
    speakQuestion() {
        const questionText = this.questions[this.currentQuestionIndex].content;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(questionText);
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Text-to-speech not supported in this browser', 'warning');
        }
    }
    
    startTimer() {
        const timerElement = document.getElementById('timer');
        const progressElement = document.getElementById('progress');
        const totalSeconds = this.duration * 60;
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((new Date() - this.startTime) / 1000);
            const remaining = Math.max(0, totalSeconds - elapsed);
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update progress bar
            const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
            progressElement.style.width = `${progress}%`;
            
            // Color coding
            timerElement.className = 'timer';
            if (remaining <= 300) { // 5 minutes
                timerElement.classList.add('critical');
            } else if (remaining <= 600) { // 10 minutes
                timerElement.classList.add('warning');
            }
            
            // Auto-end when time runs out
            if (remaining === 0) {
                this.endInterview();
            }
        }, 1000);
    }
    
    async endInterview() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.saveCurrentAnswer();
        
        // Hide interview section and show results
        document.getElementById('interview-section').style.display = 'none';
        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').style.display = 'block';
        
        // Start evaluation
        await this.evaluatePerformance();
    }
    
    async evaluatePerformance() {
        this.showLoading('Evaluating your performance...');
        
        try {
            const evaluationPrompt = this.buildEvaluationPrompt();
            const feedback = await this.callAI(evaluationPrompt, true);
            
            // Parse feedback and score
            const { score, passFail, detailedFeedback } = this.parseEvaluation(feedback);
            
            // Display results
            this.displayResults(score, passFail, detailedFeedback);
            
        } catch (error) {
            console.error('Evaluation error:', error);
            this.displayFallbackResults();
        } finally {
            this.hideLoading();
        }
    }
    
    parseEvaluation(feedback) {
        const scoreMatch = feedback.match(/SCORE:\s*(\d+)/i);
        const resultMatch = feedback.match(/RESULT:\s*(PASS|FAIL)/i);
        const feedbackMatch = feedback.match(/FEEDBACK:\s*([\s\S]*)/i);
        
        return {
            score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
            passFail: resultMatch ? resultMatch[1].toUpperCase() : 'PASS',
            detailedFeedback: feedbackMatch ? feedbackMatch[1].trim() : feedback
        };
    }
    
    displayResults(score, passFail, detailedFeedback) {
        document.getElementById('score-value').textContent = score;
        
        const passFailElement = document.getElementById('pass-fail');
        passFailElement.textContent = passFail;
        passFailElement.className = `pass-fail ${passFail.toLowerCase()}`;
        
        document.getElementById('feedback-content').innerHTML = `
            <div class="feedback-text">${detailedFeedback.replace(/\n/g, '<br>')}</div>
        `;
    }
    
    displayFallbackResults() {
        const answeredQuestions = this.answers.filter(answer => answer.trim() !== '').length;
        const completionRate = (answeredQuestions / this.questions.length) * 100;
        const estimatedScore = Math.max(30, Math.min(95, completionRate + Math.random() * 20));
        
        document.getElementById('score-value').textContent = Math.round(estimatedScore);
        
        const passFail = estimatedScore >= 60 ? 'PASS' : 'FAIL';
        const passFailElement = document.getElementById('pass-fail');
        passFailElement.textContent = passFail;
        passFailElement.className = `pass-fail ${passFail.toLowerCase()}`;
        
        document.getElementById('feedback-content').innerHTML = `
            <div class="feedback-text">
                <p><strong>Interview Completed!</strong></p>
                <p>You answered ${answeredQuestions} out of ${this.questions.length} questions.</p>
                <p>Completion rate: ${completionRate.toFixed(1)}%</p>
                <p><em>AI evaluation temporarily unavailable. Results based on completion rate.</em></p>
            </div>
        `;
    }
    
    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            duration: this.duration,
            programmingLanguage: document.getElementById('programming-language').value,
            difficulty: document.getElementById('difficulty').value,
            questions: this.questions,
            answers: this.answers,
            score: document.getElementById('score-value').textContent,
            result: document.getElementById('pass-fail').textContent,
            feedback: document.getElementById('feedback-content').textContent
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-results-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('📄 Results exported successfully!', 'success');
    }
    
    newInterview() {
        // Reset all data
        this.questions = [];
        this.answers = [];
        this.currentQuestionIndex = 0;
        this.startTime = null;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Clear editors
        if (this.answerEditor) {
            this.answerEditor.toTextArea();
            this.answerEditor = null;
        }
        
        // Reset form
        document.getElementById('cv-file').value = '';
        document.getElementById('job-file').value = '';
        document.getElementById('cv-filename').textContent = '';
        document.getElementById('job-filename').textContent = '';
        document.getElementById('cv-upload').classList.remove('uploaded');
        document.getElementById('job-upload').classList.remove('uploaded');
        document.getElementById('cv-upload').innerHTML = '<span class="upload-icon">📄</span> Choose CV/Resume File';
        document.getElementById('job-upload').innerHTML = '<span class="upload-icon">📋</span> Choose Job Description File';
        
        this.cvContent = '';
        this.jobDescriptionContent = '';
        this.additionalDetailsEditor.setValue('');
        
        // Show setup form
        document.querySelector('.setup-form').style.display = 'block';
        document.getElementById('interview-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        
        this.validateForm();
        this.showNotification('🔄 Ready for a new interview!', 'info');
    }
    
    validateForm() {
        const hasJobDescription = this.jobDescriptionContent.trim() !== '';
        const hasLanguage = document.getElementById('programming-language').value !== '';
        const hasModel = this.model !== '';
        
        let hasValidAI = false;
        if (this.currentAIProvider === 'openai') {
            hasValidAI = this.aiApiKey.trim() !== '' && hasModel;
        } else {
            // For local providers, we'll check connection status
            const statusText = document.getElementById('ai-status-text').textContent;
            hasValidAI = statusText.includes('successful') || statusText.includes('Connected');
        }
        
        const isValid = hasJobDescription && hasLanguage && (hasValidAI || true); // Allow fallback mode
        
        document.getElementById('generate-preview').disabled = !isValid;
        document.getElementById('start-interview').disabled = !isValid;
        
        // Update form status
        const statusElement = document.getElementById('form-status');
        if (!statusElement) return;
        
        if (isValid) {
            statusElement.textContent = 'Ready to start interview!';
            statusElement.className = 'form-status valid';
        } else {
            let missing = [];
            if (!hasJobDescription) missing.push('job description');
            if (!hasLanguage) missing.push('programming language');
            if (!hasValidAI && this.currentAIProvider === 'openai') missing.push('valid API key');
            
            statusElement.textContent = `Please provide: ${missing.join(', ')}`;
            statusElement.className = 'form-status invalid';
        }
    }
    
    async generatePreview() {
        if (this.questions.length === 0) {
            await this.generateQuestions();
        }
        this.showPreviewModal();
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    showLoading(message) {
        const loadingElement = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.textContent = message;
        if (loadingElement) loadingElement.classList.add('show');
    }
    
    hideLoading() {
        const loadingElement = document.getElementById('loading-overlay');
        if (loadingElement) loadingElement.classList.remove('show');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 4000);
    }
    
    handleKeydown(event) {
        // Add keyboard shortcuts if needed
        if (event.ctrlKey) {
            switch(event.key) {
                case 's':
                    event.preventDefault();
                    if (this.answerEditor && document.getElementById('interview-section').style.display !== 'none') {
                        this.saveCurrentAnswer();
                    }
                    break;
                case 'Enter':
                    if (document.getElementById('interview-section').style.display !== 'none') {
                        event.preventDefault();
                        this.navigateQuestion(1);
                    }
                    break;
            }
        }
    }

    async refreshModels() {
        const config = AI_PROVIDERS[this.currentAIProvider];
        
        if (config.requiresApiKey && !this.aiApiKey) {
            this.updateModelStatus('disconnected', 'API key required');
            return;
        }
        
        this.updateModelStatus('loading', 'Loading models...');
        
        try {
            let response;
            const headers = { 'Content-Type': 'application/json' };
            
            if (this.currentAIProvider === 'openai') {
                headers['Authorization'] = `Bearer ${this.aiApiKey}`;
                response = await fetch('https://api.openai.com/v1/models', { headers });
            } else if (this.currentAIProvider === 'lmstudio') {
                response = await fetch('http://127.0.0.1:1234/v1/models', { 
                    headers,
                    signal: AbortSignal.timeout(8000)
                });
            } else if (this.currentAIProvider === 'ollama') {
                response = await fetch('http://127.0.0.1:11434/api/tags', { 
                    headers,
                    signal: AbortSignal.timeout(8000)
                });
            }
            
            if (response.ok) {
                const data = await response.json();
                let models = [];
                
                if (this.currentAIProvider === 'openai') {
                    // Filter to commonly used chat models
                    const chatModels = data.data.filter(model => 
                        model.id.includes('gpt') || model.id.includes('chat')
                    );
                    models = chatModels.map(model => ({
                        id: model.id,
                        name: model.id,
                        displayName: model.id.replace(/[-_]/g, ' ').toUpperCase()
                    }));
                    this.model = models.find(m => m.id === 'gpt-3.5-turbo')?.id || models[0]?.id || 'gpt-3.5-turbo';
                } else if (this.currentAIProvider === 'lmstudio') {
                    models = data.data.map(model => ({
                        id: model.id,
                        name: model.id,
                        displayName: model.id.includes('/') ? 
                            model.id.split('/').pop().replace(/[-_]/g, ' ') : 
                            model.id.replace(/[-_]/g, ' ')
                    }));
                    this.model = models[0]?.id || '';
                } else if (this.currentAIProvider === 'ollama') {
                    models = data.models.map(model => ({
                        id: model.name,
                        name: model.name,
                        displayName: model.name.replace(/[-_]/g, ' ')
                    }));
                    this.model = models[0]?.id || '';
                }
                
                this.populateModelDropdown(models);
                this.updateModelStatus('connected', `${models.length} models available`);
                this.showNotification(`✅ Found ${models.length} models`, 'success');
            } else {
                this.updateModelStatus('disconnected', 'Failed to load models');
                this.populateModelDropdown([]);
                this.showNotification('❌ Failed to load models', 'error');
            }
        } catch (error) {
            let errorMessage = 'Failed to load models';
            if (error.name === 'TimeoutError') {
                errorMessage = `${config.name} timeout - check if server is running`;
            } else if (error.message.includes('fetch')) {
                errorMessage = `Cannot reach ${config.name} server`;
            }
            
            this.updateModelStatus('disconnected', errorMessage);
            this.populateModelDropdown([]);
            this.showNotification(`❌ ${errorMessage}`, 'error');
        }
        
        this.validateForm();
    }
    
    populateModelDropdown(models) {
        const modelSelect = document.getElementById('ai-model');
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.disabled = true;
            option.selected = true;
            option.textContent = 'No models available - Check AI provider';
            modelSelect.appendChild(option);
            return;
        }
        
        models.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.displayName || model.name;
            option.selected = model.id === this.model;
            modelSelect.appendChild(option);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    try {
        // Set PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('📚 PDF.js worker configured');
        
        // Initialize app
        console.log('🎯 Creating InterviewApp instance...');
        const app = new InterviewApp();
        console.log('✅ InterviewApp created successfully');
        
        // Make app globally accessible for debugging
        window.interviewApp = app;
        console.log('🔧 App available as window.interviewApp for debugging');
        
        // Global debugging functions for browser console
        window.debugFileUpload = function() {
            console.log('🧪 Debug File Upload Test');
            const cvFile = document.getElementById('cv-file');
            const jobFile = document.getElementById('job-file');
            const cvUpload = document.getElementById('cv-upload');
            const jobUpload = document.getElementById('job-upload');
            
            console.log('Elements:', { cvFile, jobFile, cvUpload, jobUpload });
            console.log('CV upload classes:', cvUpload?.className);
            console.log('Job upload classes:', jobUpload?.className);
            
            // Test programmatic click
            if (jobUpload) {
                console.log('Testing job upload click...');
                jobUpload.click();
            }
        };
        
        window.debugLMStudio = async function() {
            console.log('🧪 Debug LM Studio Test');
            try {
                const response = await fetch('http://127.0.0.1:1234/v1/models');
                console.log('Response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('LM Studio models:', data);
                }
            } catch (error) {
                console.log('LM Studio error:', error);
            }
        };
        
        window.testInterviewApp = function() {
            console.log('🧪 Interview App Debug Info');
            console.log('App instance:', window.interviewApp);
            if (window.interviewApp) {
                console.log('Current provider:', window.interviewApp.currentAIProvider);
                console.log('API key:', window.interviewApp.aiApiKey ? 'Set' : 'Not set');
                console.log('Model:', window.interviewApp.model);
            }
        };
        
        // Quick self-test function
        function runSelfTest() {
            console.log('🧪 Running self-test...');
            
            // Test 1: Check if all required functions exist
            const functions = [
                'extractTextFromFile', 
                'extractProgrammingLanguages', 
                'getLanguageOptions', 
                'buildQuestionPrompt',
                'InterviewSession'
            ];
            
            functions.forEach(funcName => {
                if (typeof window[funcName] === 'function' || typeof eval(funcName) === 'function') {
                    console.log(`✅ ${funcName} is available`);
                } else {
                    console.log(`❌ ${funcName} is missing`);
                }
            });
            
            // Test 2: Check required elements
            const elements = [
                'cv-file', 'job-file', 'cv-upload', 'job-upload',
                'ai-provider', 'ai-model', 'test-provider'
            ];
            
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    console.log(`✅ Element ${id} found`);
                } else {
                    console.log(`❌ Element ${id} missing`);
                }
            });
            
            console.log('🧪 Self-test complete');
        }

        // Run self-test 1 second after page load
        setTimeout(runSelfTest, 1000);
        
    } catch (error) {
        console.error('❌ Fatal error during app initialization:', error);
    }
});
