// Main Interview Application Class - Refactored Version
// Imports and uses modular components

const { extractProgrammingLanguages, getLanguageOptions, generateLanguageDropdownOptions, getCodeMirrorMode } = require('./modules/utils');
const { AIProviderManager } = require('./modules/aiProvider');
const { buildQuestionPrompt, buildEvaluationPrompt, parseQuestionsFromResponse, parseEvaluationFromResponse } = require('./modules/promptBuilder');
const InterviewSession = require('./modules/interviewSession');
const { generateStarterCode } = require('./modules/codeTemplates');

class InterviewApp {
    constructor() {
        this.aiProvider = new AIProviderManager();
        this.session = new InterviewSession();
        this.cvContent = '';
        this.jobDescriptionContent = '';
        this.additionalDetailsEditor = null;
        this.answerEditor = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        this.init();
    }
    
    init() {
        console.log('🎯 Interview Preparation App - Web Version');
        console.log('🚀 Initializing application...');
        
        try {
            this.setupEventListeners();
            this.initializeCodeMirror();
            this.loadSavedSettings();
            this.checkAIConnection();
            this.validateForm();
            
            console.log('🎉 Application initialization complete!');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }
    
    setupEventListeners() {
        // File upload handlers
        const cvFile = document.getElementById('cv-file');
        const jobFile = document.getElementById('job-file');
        const cvUpload = document.getElementById('cv-upload');
        const jobUpload = document.getElementById('job-upload');
        
        if (cvFile && jobFile && cvUpload && jobUpload) {
            cvFile.addEventListener('change', (e) => this.handleFileUpload(e, 'cv'));
            jobFile.addEventListener('change', (e) => this.handleFileUpload(e, 'job'));
            cvUpload.addEventListener('click', (e) => {
                e.preventDefault();
                cvFile.click();
            });
            jobUpload.addEventListener('click', (e) => {
                e.preventDefault();
                jobFile.click();
            });
        }
        
        // Form handlers
        const startBtn = document.getElementById('start-interview');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startInterview());
        }
        
        // AI provider handlers
        const providerSelect = document.getElementById('ai-provider');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => this.handleProviderChange(e.target.value));
        }
        
        // Interview navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    
    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const content = await this.readFileContent(file);
            
            if (type === 'cv') {
                this.cvContent = content;
                this.displayUploadSuccess('cv-status', file.name);
                this.extractAndDisplayLanguages(content);
            } else if (type === 'job') {
                this.jobDescriptionContent = content;
                this.displayUploadSuccess('job-status', file.name);
                this.extractAndDisplayLanguages(content);
            }
            
            this.validateForm();
        } catch (error) {
            console.error('File upload error:', error);
            this.displayUploadError(type + '-status', error.message);
        }
    }
    
    async readFileContent(file) {
        if (file.type === 'application/pdf') {
            // For PDF files, you'd need a PDF parsing library
            throw new Error('PDF parsing not implemented in web version. Please use text files.');
        } else {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }
    }
    
    extractAndDisplayLanguages(content) {
        try {
            const detectedLanguages = extractProgrammingLanguages(content);
            const languageOptions = getLanguageOptions(detectedLanguages);
            this.updateLanguageDropdown(languageOptions);
        } catch (error) {
            console.error('Language extraction error:', error);
        }
    }
    
    updateLanguageDropdown(options) {
        const dropdown = document.getElementById('languages');
        if (dropdown && options.length > 0) {
            const optionsHtml = generateLanguageDropdownOptions(options, 'Detected Languages');
            dropdown.innerHTML = optionsHtml + dropdown.innerHTML;
        }
    }
    
    async handleProviderChange(providerId) {
        try {
            this.aiProvider.setProvider(providerId);
            await this.loadModels();
            this.validateForm();
        } catch (error) {
            console.error('Provider change error:', error);
            this.showError('Failed to change AI provider: ' + error.message);
        }
    }
    
    async loadModels() {
        try {
            const result = await this.aiProvider.loadModels();
            this.updateModelDropdown(result.models);
            return result;
        } catch (error) {
            console.error('Model loading error:', error);
            return { success: false, error: error.message };
        }
    }
    
    updateModelDropdown(models) {
        const dropdown = document.getElementById('model');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select a model...</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                dropdown.appendChild(option);
            });
        }
    }
    
    async startInterview() {
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Generate questions
            const questionsResult = await this.generateQuestions(formData);
            if (!questionsResult.success) {
                throw new Error('Failed to generate questions: ' + questionsResult.error);
            }
            
            // Start interview session
            this.questions = questionsResult.questions;
            const duration = formData.duration * 60000; // Convert to milliseconds
            this.session.start(this.questions, formData, duration);
            
            // Switch to interview interface
            this.showInterviewInterface();
            this.displayCurrentQuestion();
            
        } catch (error) {
            console.error('Start interview error:', error);
            this.showError('Failed to start interview: ' + error.message);
        }
    }
    
    collectFormData() {
        return {
            cvContent: this.cvContent,
            jobDescription: this.jobDescriptionContent,
            selectedLanguages: Array.from(document.getElementById('languages').selectedOptions).map(opt => opt.value),
            experienceLevel: document.getElementById('experience').value,
            difficulty: document.getElementById('difficulty').value,
            questionCount: parseInt(document.getElementById('questions').value),
            duration: parseInt(document.getElementById('duration').value)
        };
    }
    
    async generateQuestions(data) {
        try {
            const prompt = buildQuestionPrompt(data);
            const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: `Generate ${data.questionCount} interview questions.` }
            ];
            
            const response = await this.aiProvider.makeRequest(messages);
            return parseQuestionsFromResponse(response);
            
        } catch (error) {
            console.error('Question generation error:', error);
            return this.generateFallbackQuestions(data);
        }
    }
    
    generateFallbackQuestions(data) {
        // Simple fallback questions
        const questions = [
            { id: 1, question: "Tell me about your programming experience.", type: "behavioral" },
            { id: 2, question: "Describe a challenging project you've worked on.", type: "behavioral" },
            { id: 3, question: "How do you approach debugging complex issues?", type: "technical" },
            { id: 4, question: "What's your favorite programming language and why?", type: "technical" },
            { id: 5, question: "How do you stay updated with new technologies?", type: "behavioral" }
        ];
        
        return {
            success: true,
            questions: questions.slice(0, data.questionCount),
            metadata: { generatedBy: 'fallback' }
        };
    }
    
    showInterviewInterface() {
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('interview-container').style.display = 'block';
    }
    
    displayCurrentQuestion() {
        const question = this.session.getCurrentQuestion();
        if (question) {
            document.getElementById('current-question').textContent = question.question;
            document.getElementById('question-counter').textContent = 
                `Question ${question.index + 1} of ${question.total}`;
            
            // Initialize code editor with starter code if it's a coding question
            if (question.type === 'coding' && this.answerEditor) {
                const language = this.getSelectedLanguage();
                const starterCode = generateStarterCode(language, question.question);
                this.answerEditor.setValue(starterCode);
            }
        }
    }
    
    getSelectedLanguage() {
        const langSelect = document.getElementById('languages');
        return langSelect ? langSelect.value : 'javascript';
    }
    
    initializeCodeMirror() {
        // Initialize code editors
        const additionalDetails = document.getElementById('additional-details');
        const answerArea = document.getElementById('answer');
        
        if (additionalDetails && typeof CodeMirror !== 'undefined') {
            this.additionalDetailsEditor = CodeMirror.fromTextArea(additionalDetails, {
                mode: 'text/plain',
                theme: 'default',
                lineNumbers: true,
                lineWrapping: true
            });
        }
        
        if (answerArea && typeof CodeMirror !== 'undefined') {
            this.answerEditor = CodeMirror.fromTextArea(answerArea, {
                mode: 'javascript',
                theme: 'default',
                lineNumbers: true,
                lineWrapping: true
            });
        }
    }
    
    validateForm() {
        const isValid = this.cvContent || this.jobDescriptionContent;
        const startBtn = document.getElementById('start-interview');
        if (startBtn) {
            startBtn.disabled = !isValid;
        }
    }
    
    async checkAIConnection() {
        try {
            const result = await this.aiProvider.testConnection();
            this.updateConnectionStatus(result);
        } catch (error) {
            this.updateConnectionStatus({ success: false, error: error.message });
        }
    }
    
    updateConnectionStatus(result) {
        const statusElement = document.getElementById('ai-status');
        if (statusElement) {
            statusElement.textContent = result.success ? 'Connected' : 'Disconnected';
            statusElement.className = result.success ? 'status-success' : 'status-error';
        }
    }
    
    loadSavedSettings() {
        // Load any saved settings from localStorage
        try {
            const saved = localStorage.getItem('interviewAppSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                // Apply saved settings
            }
        } catch (error) {
            console.log('No saved settings found');
        }
    }
    
    displayUploadSuccess(elementId, filename) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `✓ ${filename} uploaded successfully`;
            element.className = 'upload-success';
        }
    }
    
    displayUploadError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `✗ ${message}`;
            element.className = 'upload-error';
        }
    }
    
    showError(message) {
        // Display error message to user
        console.error(message);
        alert(message); // Simple error display
    }
    
    handleKeydown(event) {
        // Handle keyboard shortcuts during interview
        if (this.session.isActive) {
            if (event.key === 'ArrowLeft' && event.ctrlKey) {
                this.previousQuestion();
            } else if (event.key === 'ArrowRight' && event.ctrlKey) {
                this.nextQuestion();
            }
        }
    }
    
    nextQuestion() {
        if (this.session) {
            this.session.nextQuestion();
            this.displayCurrentQuestion();
        }
    }
    
    previousQuestion() {
        if (this.session) {
            this.session.previousQuestion();
            this.displayCurrentQuestion();
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.interviewApp = new InterviewApp();
});

module.exports = InterviewApp;