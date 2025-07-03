// Working Interview App - Fixed Version
// Fixes for file upload and LM Studio detection issues

console.log('🎯 Starting Interview Preparation App - Fixed Version');

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

// Simple utility functions
function extractProgrammingLanguages(text) {
    const languages = [
        { keywords: ['javascript', 'js', 'node.js', 'react', 'vue'], name: 'JavaScript', value: 'javascript' },
        { keywords: ['python', 'django', 'flask', 'fastapi'], name: 'Python', value: 'python' },
        { keywords: ['java', 'spring', 'hibernate'], name: 'Java', value: 'java' },
        { keywords: ['typescript', 'ts', 'angular'], name: 'TypeScript', value: 'typescript' },
        { keywords: ['c#', 'csharp', '.net'], name: 'C#', value: 'csharp' },
        { keywords: ['go', 'golang'], name: 'Go', value: 'go' }
    ];

    const detected = [];
    const textLower = text.toLowerCase();
    
    languages.forEach(lang => {
        if (lang.keywords.some(keyword => textLower.includes(keyword))) {
            detected.push({ label: lang.name, value: lang.value });
        }
    });
    
    return detected;
}

async function extractTextFromFile(file, type) {
    if (type === 'txt') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read text file'));
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
                reject(new Error('Failed to extract text from PDF: ' + error.message));
            }
        });
    } else {
        throw new Error('Unsupported file type');
    }
}

class FixedInterviewApp {
    constructor() {
        console.log('🏗️ Creating FixedInterviewApp instance');
        
        this.currentAIProvider = 'lmstudio';
        this.aiApiKey = '';
        this.model = '';
        this.cvContent = '';
        this.jobDescriptionContent = '';
        this.questions = [];
        this.answers = [];
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing app...');
        this.setupEventListeners();
        this.loadSavedSettings();
        this.testProviderConnection();
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // File upload handlers - FIXED VERSION
        const cvFile = document.getElementById('cv-file');
        const jobFile = document.getElementById('job-file');
        const cvUpload = document.getElementById('cv-upload');
        const jobUpload = document.getElementById('job-upload');
        
        if (cvFile && cvUpload) {
            console.log('✅ CV upload elements found');
            cvFile.addEventListener('change', (e) => this.handleFileUpload(e, 'cv'));
            cvUpload.addEventListener('click', (e) => {
                console.log('🖱️ CV upload button clicked');
                e.preventDefault();
                cvFile.click();
            });
        } else {
            console.error('❌ CV upload elements not found');
        }
        
        if (jobFile && jobUpload) {
            console.log('✅ Job upload elements found');
            jobFile.addEventListener('change', (e) => this.handleFileUpload(e, 'job'));
            jobUpload.addEventListener('click', (e) => {
                console.log('🖱️ Job upload button clicked');
                e.preventDefault();
                jobFile.click();
            });
        } else {
            console.error('❌ Job upload elements not found');
        }
        
        // AI provider handlers
        const testProvider = document.getElementById('test-provider');
        const refreshModels = document.getElementById('refresh-models');
        const aiProvider = document.getElementById('ai-provider');
        
        if (testProvider) testProvider.addEventListener('click', () => this.testProviderConnection());
        if (refreshModels) refreshModels.addEventListener('click', () => this.refreshModels());
        if (aiProvider) aiProvider.addEventListener('change', (e) => this.handleProviderChange(e));
        
        console.log('✅ Event listeners set up');
    }
    
    async handleFileUpload(event, type) {
        console.log(`📁 File upload for ${type}`);
        const file = event.target.files[0];
        if (!file) return;
        
        console.log(`Processing file: ${file.name} (${file.type})`);
        
        try {
            let content = '';
            
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                content = await extractTextFromFile(file, 'pdf');
            } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
                content = await extractTextFromFile(file, 'txt');
            } else {
                throw new Error('Unsupported file type. Please use PDF or TXT files.');
            }
            
            console.log(`✅ File processed: ${content.length} characters`);
            
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
                
                // Extract programming languages
                const languages = extractProgrammingLanguages(content);
                this.updateProgrammingLanguages(languages);
                this.showNotification(`✅ Job description uploaded: ${file.name}`, 'success');
            }
            
        } catch (error) {
            console.error('❌ File processing error:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }
    
    async testProviderConnection() {
        console.log('🧪 Testing AI provider connection...');
        const config = AI_PROVIDERS[this.currentAIProvider];
        
        if (config.requiresApiKey && !this.aiApiKey) {
            this.updateAIStatus('disconnected', 'Enter API key to connect');
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
                console.log('🔍 Testing LM Studio at http://127.0.0.1:1234/v1/models');
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
            
            console.log(`Response status: ${response.status}`);
            
            if (response.ok) {
                this.updateAIStatus('connected', `${config.name} connection successful`);
                this.showNotification(`✅ ${config.name} connected!`, 'success');
                await this.refreshModels();
            } else {
                this.updateAIStatus('disconnected', `${config.name} error: ${response.status}`);
                this.showNotification(`❌ ${config.name} connection failed`, 'error');
            }
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            let errorMessage = 'Connection failed';
            if (error.name === 'TimeoutError') {
                errorMessage = `${config.name} timeout - is it running?`;
            } else if (error.message.includes('fetch')) {
                errorMessage = `Cannot reach ${config.name} - not running?`;
            }
            
            this.updateAIStatus('disconnected', errorMessage);
            this.showNotification(`❌ ${errorMessage}`, 'error');
        }
    }
    
    async refreshModels() {
        console.log('🔄 Refreshing models...');
        const config = AI_PROVIDERS[this.currentAIProvider];
        
        try {
            let response;
            const headers = { 'Content-Type': 'application/json' };
            
            if (this.currentAIProvider === 'openai') {
                headers['Authorization'] = `Bearer ${this.aiApiKey}`;
                response = await fetch('https://api.openai.com/v1/models', { headers });
            } else if (this.currentAIProvider === 'lmstudio') {
                response = await fetch('http://127.0.0.1:1234/v1/models', { headers });
            } else if (this.currentAIProvider === 'ollama') {
                response = await fetch('http://127.0.0.1:11434/api/tags', { headers });
            }
            
            if (response.ok) {
                const data = await response.json();
                let models = [];
                
                if (this.currentAIProvider === 'openai') {
                    models = data.data.filter(m => m.id.includes('gpt')).map(m => ({
                        id: m.id, name: m.id, displayName: m.id.toUpperCase()
                    }));
                } else if (this.currentAIProvider === 'lmstudio') {
                    models = data.data.map(m => ({
                        id: m.id, name: m.id, displayName: m.id.includes('/') ? m.id.split('/').pop() : m.id
                    }));
                } else if (this.currentAIProvider === 'ollama') {
                    models = data.models.map(m => ({
                        id: m.name, name: m.name, displayName: m.name
                    }));
                }
                
                this.populateModelDropdown(models);
                this.updateModelStatus('connected', `${models.length} models available`);
                console.log(`✅ Found ${models.length} models`);
            }
        } catch (error) {
            console.error('❌ Failed to refresh models:', error);
            this.updateModelStatus('disconnected', 'Failed to load models');
        }
    }
    
    populateModelDropdown(models) {
        const modelSelect = document.getElementById('ai-model');
        if (!modelSelect) return;
        
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            option.selected = true;
            modelSelect.appendChild(option);
            return;
        }
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.displayName || model.name;
            modelSelect.appendChild(option);
        });
        
        // Select first model
        if (models.length > 0) {
            modelSelect.value = models[0].id;
            this.model = models[0].id;
        }
    }
    
    updateProgrammingLanguages(languages) {
        const languageSelect = document.getElementById('programming-language');
        if (!languageSelect) return;
        
        languageSelect.innerHTML = '';
        
        // Add detected languages
        if (languages.length > 0) {
            const group = document.createElement('optgroup');
            group.label = 'Detected from job description:';
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.value;
                option.textContent = lang.label;
                group.appendChild(option);
            });
            languageSelect.appendChild(group);
        }
        
        // Add common languages
        const commonGroup = document.createElement('optgroup');
        commonGroup.label = 'Other languages:';
        const common = [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'csharp', label: 'C#' },
            { value: 'cpp', label: 'C++' }
        ];
        
        common.forEach(lang => {
            if (!languages.find(l => l.value === lang.value)) {
                const option = document.createElement('option');
                option.value = lang.value;
                option.textContent = lang.label;
                commonGroup.appendChild(option);
            }
        });
        languageSelect.appendChild(commonGroup);
        
        // Select first detected language
        if (languages.length > 0) {
            languageSelect.value = languages[0].value;
        }
    }
    
    handleProviderChange(event) {
        this.currentAIProvider = event.target.value;
        localStorage.setItem('ai_provider', this.currentAIProvider);
        this.updateProviderConfig();
        this.testProviderConnection();
    }
    
    updateProviderConfig() {
        const config = AI_PROVIDERS[this.currentAIProvider];
        const providerConfig = document.getElementById('provider-config');
        
        if (config.requiresApiKey) {
            providerConfig.style.display = 'block';
        } else {
            providerConfig.style.display = 'none';
        }
    }
    
    loadSavedSettings() {
        const savedProvider = localStorage.getItem('ai_provider');
        if (savedProvider && AI_PROVIDERS[savedProvider]) {
            this.currentAIProvider = savedProvider;
            document.getElementById('ai-provider').value = savedProvider;
        }
        
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey && this.currentAIProvider === 'openai') {
            this.aiApiKey = savedKey;
            document.getElementById('api-key').value = savedKey;
        }
        
        this.updateProviderConfig();
    }
    
    updateAIStatus(status, message) {
        const indicator = document.getElementById('ai-status-indicator');
        const text = document.getElementById('ai-status-text');
        
        if (indicator) indicator.className = `status-indicator ${status}`;
        if (text) text.textContent = message;
    }
    
    updateModelStatus(status, message) {
        const indicator = document.querySelector('#model-status .status-indicator');
        const text = document.querySelector('#model-status .status-text');
        
        if (indicator) indicator.className = `status-indicator ${status}`;
        if (text) text.textContent = message;
    }
    
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        if (type === 'success') notification.style.background = '#28a745';
        else if (type === 'error') notification.style.background = '#dc3545';
        else if (type === 'warning') notification.style.background = '#ffc107';
        else notification.style.background = '#17a2b8';
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.style.opacity = '1', 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, setting up PDF.js...');
    
    // Set PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('✅ PDF.js configured');
    } else {
        console.warn('⚠️ PDF.js not loaded');
    }
    
    // Create app instance
    console.log('🚀 Creating app instance...');
    const app = new FixedInterviewApp();
    window.fixedApp = app; // For debugging
    console.log('✅ App created and available as window.fixedApp');
});
