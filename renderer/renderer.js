const { ipcRenderer } = require('electron');
const { generateLanguageDropdownOptionObjects } = require('../shared/languageUtils');
const { InterviewSession } = require('../shared/interviewSession');

// Global variables
let cvContent = '';
let jobDescriptionContent = '';
let additionalDetailsEditor;
let generatedQuestions = '';
let availableModels = [];
let selectedModel = null;

// Interview session state (shared logic)
let interviewSession = null;

// Initialize CodeMirror for additional details
document.addEventListener('DOMContentLoaded', () => {
    console.log('Interview Preparation App - Initializing...');
    initializeCodeMirror();
    setupEventListeners();
    checkAIConnection();
    showAppStatus();
    
    // Initialize with default languages
    populateDefaultLanguages();
    
    // Load current AI provider and available models
    loadCurrentAIProvider();
    loadAvailableModels();
});

function showAppStatus() {
    console.log('✅ Interview Preparation App loaded successfully');
    console.log('📋 Ready to upload CV and job description');
    console.log('🔍 Checking AI connection...');
    
    // Show a brief welcome notification
    setTimeout(() => {
        showNotification('Interview Preparation App loaded successfully! Upload your documents to begin.', 'success');
    }, 1000);
}

function initializeCodeMirror() {
    additionalDetailsEditor = CodeMirror(document.getElementById('additional-details-editor'), {
        mode: 'markdown',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        placeholder: 'Enter any specific requirements, technologies to focus on, interview style preferences, etc...\n\nExample:\n- Focus on React and Node.js\n- Include system design questions\n- Emphasis on problem-solving approach\n- Prefer practical coding challenges',
        value: ''
    });
}

function setupEventListeners() {
    // File upload handlers
    document.getElementById('cv-upload').addEventListener('click', () => uploadFile('cv'));
    document.getElementById('job-upload').addEventListener('click', () => uploadFile('job'));
    
    // Button handlers
    document.getElementById('generate-preview').addEventListener('click', generateQuestionsPreview);
    document.getElementById('start-interview').addEventListener('click', startInterview);
    document.getElementById('refresh-models').addEventListener('click', loadAvailableModels);
    document.getElementById('test-provider').addEventListener('click', testAIProvider);
    
    // AI Provider handlers
    document.getElementById('ai-provider').addEventListener('change', onProviderChange);
    
    // API key input - ensure paste functionality works
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        // Ensure paste events work properly
        apiKeyInput.addEventListener('paste', (e) => {
            console.log('🔑 API key paste event triggered');
            // Allow default paste behavior
            setTimeout(() => {
                console.log('🔑 API key value after paste:', apiKeyInput.value.length > 0 ? '[REDACTED]' : 'empty');
                validateForm();
            }, 10);
        });
        
        // Also handle input events
        apiKeyInput.addEventListener('input', (e) => {
            console.log('🔑 API key input changed');
            validateForm();
        });
        
        // Ensure the input is not disabled or readonly
        apiKeyInput.removeAttribute('disabled');
        apiKeyInput.removeAttribute('readonly');
        
        // Add specific attributes to ensure paste works
        apiKeyInput.setAttribute('contenteditable', 'false'); // Reset any conflicting attributes
        apiKeyInput.style.webkitUserSelect = 'text';
        apiKeyInput.style.mozUserSelect = 'text';
        apiKeyInput.style.userSelect = 'text';
        
        // Add a class to identify this as a paste-allowed input
        apiKeyInput.classList.add('paste-allowed');
    }
    
    // Form validation
    document.getElementById('programming-language').addEventListener('change', validateForm);
    document.getElementById('ai-model').addEventListener('change', onModelChange);
    
    // Modal handlers
    document.getElementById('regenerate-questions').addEventListener('click', regenerateQuestions);
    document.getElementById('proceed-interview').addEventListener('click', proceedToInterview);
    
    // Close modal handlers
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Validation
    document.getElementById('duration').addEventListener('change', validateForm);
    document.getElementById('question-count').addEventListener('change', validateForm);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // F12 to toggle developer tools (for debugging)
        if (event.key === 'F12') {
            console.log('F12 pressed - Developer tools should toggle');
        }
        
        // Ctrl+R to reload (for development)
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            console.log('Reload shortcut pressed');
        }
    });
}

async function uploadFile(type) {
    try {
        const result = await ipcRenderer.invoke('upload-file', type);
        
        if (result.success) {        if (type === 'cv') {
            cvContent = result.content;
            document.getElementById('cv-filename').textContent = result.fileName;
            document.getElementById('cv-upload').classList.add('uploaded');
            document.getElementById('cv-upload').innerHTML = '<span class="upload-icon">✅</span> CV Uploaded';
            showNotification(`✅ CV uploaded: ${result.fileName}. Questions will be personalized to your background.`, 'success');
        } else if (type === 'job') {
            jobDescriptionContent = result.content;
            document.getElementById('job-filename').textContent = result.fileName;
            document.getElementById('job-upload').classList.add('uploaded');
            document.getElementById('job-upload').innerHTML = '<span class="upload-icon">✅</span> Job Description Uploaded';
            
            // Extract and populate programming languages
            await updateProgrammingLanguages(result.content);
        }
            
            validateForm();
        } else {
            showNotification('Error uploading file: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('File upload error:', error);
        showNotification('Failed to upload file', 'error');
    }
}

function validateForm() {
    const hasCV = cvContent.length > 0;
    const hasJobDesc = jobDescriptionContent.length > 0;
    const hasLanguage = document.getElementById('programming-language').value !== '';
    const hasModel = selectedModel !== null && selectedModel !== '';
    
    // CV is now optional, only require Job Description, Language, and Model
    const isValid = hasJobDesc && hasLanguage && hasModel;
    
    document.getElementById('start-interview').disabled = !isValid;
    document.getElementById('generate-preview').disabled = !isValid;
    
    // Update form status message
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
        if (!hasJobDesc) {
            statusElement.textContent = 'Please upload job description (required)';
        } else if (!hasLanguage) {
            statusElement.textContent = 'Please select a programming language';
        } else if (!hasModel) {
            statusElement.textContent = 'Please select an AI model (ensure LM Studio is running)';
        } else {
            const cvStatus = hasCV ? ' (CV uploaded for personalized questions)' : ' (CV optional - upload for personalized questions)';
            statusElement.textContent = 'Ready to start interview!' + cvStatus;
        }
    }
}

async function updateProgrammingLanguages(jobDescription) {
    try {
        const result = await ipcRenderer.invoke('extract-languages', jobDescription);
        if (result.success && result.languages.length > 0) {
            const languageSelect = document.getElementById('programming-language');
            // Use shared dropdown generator for Electron (plain objects)
            const dropdownOptions = generateLanguageDropdownOptionObjects(result.languages, 'Select from languages mentioned in job description:');
            languageSelect.innerHTML = '';
            dropdownOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                option.disabled = !!opt.disabled;
                option.selected = !!opt.selected;
                languageSelect.appendChild(option);
            });
            // Show notification about detected languages
            const languageNames = result.languages.map(l => l.label).join(', ');
            showNotification(`✅ Detected languages from job description: ${languageNames}`, 'success');
            if (!cvContent || cvContent.trim() === '') {
                setTimeout(() => {
                    showNotification('💡 Tip: Upload your CV (optional) to get questions tailored to your experience level', 'info');
                }, 2000);
            }
            validateForm();
        } else {
            populateDefaultLanguages();
            showNotification('⚠️ Could not detect specific languages from job description. Showing common options.', 'warning');
        }
    } catch (error) {
        populateDefaultLanguages();
        showNotification('⚠️ Error extracting languages. Showing common options.', 'error');
    }
}

function populateDefaultLanguages() {
    const languageSelect = document.getElementById('programming-language');
    const defaultLanguages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'csharp', label: 'C#' },
        { value: 'cpp', label: 'C++' }
    ];
    
    languageSelect.innerHTML = '';
    
    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.textContent = 'Select programming language...';
    languageSelect.appendChild(placeholderOption);
    
    // Add default languages
    defaultLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.value;
        option.textContent = lang.label;
        languageSelect.appendChild(option);
    });
}

async function loadAvailableModels() {
    try {
        updateModelStatus('loading', 'Loading models...');
        
        const result = await ipcRenderer.invoke('get-available-models');
        
        if (result.success && result.models.length > 0) {
            availableModels = result.models;
            populateModelDropdown(result.models, result.defaultModel || result.activeModel);
            
            const statusMessage = `${result.models.length} models available` + 
                (result.activeModel ? ` (auto-selected: ${result.models.find(m => m.id === result.activeModel)?.displayName || result.activeModel})` : '');
            updateModelStatus('connected', statusMessage);
        } else {
            updateModelStatus('disconnected', result.error || 'No models available');
            populateModelDropdown([], null);
        }
    } catch (error) {
        console.error('Error loading models:', error);
        updateModelStatus('disconnected', 'Failed to load models');
        populateModelDropdown([], null);
    }
}

function populateModelDropdown(models, defaultModel) {
    const modelSelect = document.getElementById('ai-model');
    modelSelect.innerHTML = '';
    
    if (models.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.disabled = true;
        option.selected = true;
        option.textContent = 'No models available - Check AI provider';
        modelSelect.appendChild(option);
        selectedModel = null;
        return;
    }
    
    // Add models
    models.forEach((model, index) => {
        const option = document.createElement('option');
        option.value = model.id;
        
        // Display name with indication if it's the active/loaded model
        const displayText = model.displayName || model.name;
        option.textContent = model.isActive ? `${displayText} (currently loaded)` : displayText;
        option.title = `${model.id}${model.isActive ? ' - Currently active model' : ''}`; // Show full model ID on hover
        
        // Select the default model (first one/active) or the specified default
        if (model.id === defaultModel || (index === 0 && !defaultModel)) {
            option.selected = true;
            selectedModel = model.id;
            console.log(`🎯 Auto-selected model: ${displayText} (${model.id})`);
        }
        
        modelSelect.appendChild(option);
    });
    
    validateForm();
}

function updateModelStatus(status, message) {
    const statusElement = document.getElementById('model-status');
    const statusIndicator = statusElement.querySelector('.status-indicator');
    const statusText = statusElement.querySelector('.status-text');
    
    // Remove existing status classes
    statusElement.classList.remove('connected', 'disconnected', 'loading');
    
    // Add new status class
    statusElement.classList.add(status);
    
    // Update indicator and text
    switch (status) {
        case 'connected':
            statusIndicator.textContent = '✅';
            break;
        case 'disconnected':
            statusIndicator.textContent = '❌';
            break;
        case 'loading':
            statusIndicator.textContent = '🔄';
            break;
    }
    
    statusText.textContent = message;
}

function onModelChange() {
    const modelSelect = document.getElementById('ai-model');
    const previousModel = selectedModel;
    selectedModel = modelSelect.value;
    
    console.log(`🎯 Model selection changed: ${previousModel || 'none'} -> ${selectedModel}`);
    
    // Show user feedback about model change
    if (selectedModel && selectedModel !== previousModel) {
        const selectedModelInfo = availableModels.find(m => m.id === selectedModel);
        const displayName = selectedModelInfo?.displayName || selectedModel;
        showNotification(`Selected AI model: ${displayName}`, 'info');
    }
    
    validateForm();
}

async function generateQuestionsPreview() {
    showLoading(true, 'Generating AI-powered interview questions...');
    
    try {
        const interviewData = gatherInterviewData();
        const result = await ipcRenderer.invoke('generate-questions', interviewData);
        
        showLoading(false);
        
        if (result.success) {
            generatedQuestions = result.questions;
            // Use shared InterviewSession for state
            interviewSession = new InterviewSession(generatedQuestions);
            showQuestionsPreview(result.questions, false, result.modelUsed);
            showNotification(`Questions generated successfully using ${result.modelUsed}`, 'success');
        } else {
            // Show fallback questions if AI is not available
            generatedQuestions = result.fallbackQuestions;
            interviewSession = new InterviewSession(result.fallbackQuestions);
            showQuestionsPreview(result.fallbackQuestions, true);
            showNotification(result.error || 'AI not available - showing sample questions', 'warning');
        }
    } catch (error) {
        showLoading(false);
        console.error('Question generation error:', error);
        showNotification('Failed to generate questions', 'error');
    }
}

function gatherInterviewData() {
    return {
        cv: cvContent,
        jobDescription: jobDescriptionContent,
        duration: parseInt(document.getElementById('duration').value),
        questionCount: parseInt(document.getElementById('question-count').value),
        programmingLanguage: document.getElementById('programming-language').value,
        interviewType: document.getElementById('interview-type').value,
        additionalDetails: additionalDetailsEditor.getValue(),
        selectedModel: selectedModel // Include selected AI model
    };
}

function showQuestionsPreview(questions, isFallback = false, modelUsed = null) {
    const previewContent = document.getElementById('questions-preview');
    const formattedQuestions = formatQuestions(questions);
    
    const modelInfo = modelUsed ? `<div class="model-info">Generated using: ${modelUsed}</div>` : '';
    const warningBanner = isFallback ? '<div class="warning-banner">⚠️ AI not available - showing sample questions</div>' : '';
    
    previewContent.innerHTML = `
        ${warningBanner}
        ${modelInfo}
        <div class="questions-preview">
            ${formattedQuestions}
        </div>
    `;
    
    document.getElementById('preview-modal').classList.add('show');
}

function formatQuestions(questionsText) {
    // Simple formatting for questions
    const lines = questionsText.split('\n').filter(line => line.trim());
    let formatted = '';
    
    lines.forEach((line, index) => {
        if (line.match(/^\d+\./)) {
            formatted += `<div class="question-item"><strong>${line}</strong></div>`;
        } else if (line.trim()) {
            formatted += `<div class="question-detail">${line}</div>`;
        }
    });
    
    return formatted || '<div class="question-item">Questions will be generated based on your CV and job description.</div>';
}

async function regenerateQuestions() {
    closeModal();
    await generateQuestionsPreview();
}

function proceedToInterview() {
    closeModal();
    startInterview();
}

async function startInterview() {
    try {
        const interviewData = gatherInterviewData();
        interviewData.questions = generatedQuestions;
        
        const result = await ipcRenderer.invoke('start-interview', interviewData);
        
        if (result.success) {
            // Interview window will open automatically
            console.log('Interview started successfully');
        } else {
            showNotification('Failed to start interview', 'error');
        }
    } catch (error) {
        console.error('Start interview error:', error);
        showNotification('Failed to start interview', 'error');
    }
}

async function checkAIConnection() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    // First test basic IPC communication
    try {
        console.log('🏓 [RENDERER] Testing basic IPC communication...');
        const pingResult = await ipcRenderer.invoke('ping');
        console.log('✅ [RENDERER] IPC test successful:', pingResult);
    } catch (error) {
        console.log('❌ [RENDERER] IPC test failed:', error.message);
        statusText.textContent = '❌ IPC communication failed';
        return;
    }
    
    // Show checking state
    statusDot.classList.remove('connected');
    statusText.textContent = 'Checking LM Studio connection...';
    
    console.log('🔍 [RENDERER] Starting AI connection check...');
    console.log('⏰ [RENDERER] Timestamp:', new Date().toISOString());
    
    try {
        console.log('� [RENDERER] About to invoke check-ai-connection IPC...');
        
        // Add a timeout wrapper for the IPC call
        const checkPromise = ipcRenderer.invoke('check-ai-connection');
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                console.log('⏰ [RENDERER] IPC call timed out after 10 seconds');
                reject(new Error('Connection check timed out after 10 seconds'));
            }, 10000);
        });
        
        console.log('⏳ [RENDERER] Waiting for IPC response...');
        const result = await Promise.race([checkPromise, timeoutPromise]);
        console.log('✅ [RENDERER] IPC response received:', result);
        
        if (result.connected) {
            statusDot.classList.add('connected');
            statusText.textContent = `✅ ${result.status}${result.modelName ? ` (${result.modelName})` : ''}`;
            console.log(`✅ ${result.provider} connected successfully:`, result.modelName);
            
            // Update AI instructions with success message
            const instructions = document.querySelector('.ai-instructions');
            instructions.innerHTML = `
                <strong>${result.provider} Connected!</strong><br>
                Model loaded: ${result.modelName || 'Unknown'}<br>
                Ready for AI-powered question generation and evaluation.
            `;
            instructions.style.color = '#22543d';
            instructions.style.backgroundColor = '#c6f6d5';
            instructions.style.padding = '10px';
            instructions.style.borderRadius = '6px';
            instructions.style.border = '1px solid #9ae6b4';
            
            showNotification(`${result.provider} connected successfully!`, 'success');
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = `⚠️ ${result.status}`;
            console.log(`⚠️ ${result.provider} not available:`, result.status);
            
            // Update instructions with setup guidance
            const instructions = document.querySelector('.ai-instructions');
            const providerName = result.provider || 'AI Provider';
            instructions.innerHTML = `
                <strong>${providerName} Setup Required:</strong><br>
                1. Download and install ${providerName}<br>
                2. Load a language model (7B+ parameters recommended)<br>
                3. Start the server on the default port<br>
                <em>The app works without AI using fallback questions.</em>
            `;
            
            showNotification(`${providerName} not detected - fallback mode active`, 'warning');
        }
        
        // Add retry button
        addRetryButton();
        
    } catch (error) {
        console.log('❌ [RENDERER] AI connection check failed:', error.message);
        console.log('⏰ [RENDERER] Error timestamp:', new Date().toISOString());
        
        statusDot.classList.remove('connected');
        statusText.textContent = '❌ Connection check failed';
        console.error('❌ AI connection check failed:', error);
        
        const instructions = document.querySelector('.ai-instructions');
        instructions.innerHTML = `
            <strong>Unable to check AI provider status.</strong><br>
            The app will work in fallback mode with sample questions.<br>
            <em>To enable AI features, ensure your AI provider is running</em>
        `;
        
        addRetryButton();
        showNotification('Unable to check AI status - using fallback mode', 'info');
    }
}

function addRetryButton() {
    // Remove existing retry button if present
    const existingRetry = document.querySelector('.retry-ai-connection');
    if (existingRetry) {
        existingRetry.remove();
    }
    
    // Add new retry button
    const aiStatus = document.querySelector('.ai-status');
    const retryButton = document.createElement('button');
    retryButton.className = 'btn btn-small retry-ai-connection';
    retryButton.innerHTML = '🔄 Check Again';
    retryButton.style.marginTop = '10px';
    retryButton.style.marginRight = '10px';
    retryButton.addEventListener('click', checkAIConnection);
    
    // Add simple test button
    const simpleTestButton = document.createElement('button');
    simpleTestButton.className = 'btn btn-small simple-test';
    simpleTestButton.innerHTML = '🔬 Simple Test';
    simpleTestButton.style.marginTop = '10px';
    simpleTestButton.style.marginRight = '10px';
    simpleTestButton.addEventListener('click', testSimpleConnection);
    
    // Add IPC test button
    const ipcTestButton = document.createElement('button');
    ipcTestButton.className = 'btn btn-small ipc-test';
    ipcTestButton.innerHTML = '🧪 IPC Test';
    ipcTestButton.style.marginTop = '10px';
    ipcTestButton.addEventListener('click', testIPC);
    
    aiStatus.appendChild(retryButton);
    aiStatus.appendChild(simpleTestButton);
    aiStatus.appendChild(ipcTestButton);
}

async function testSimpleConnection() {
    console.log('🔬 [RENDERER] Starting simple connection test...');
    
    try {
        const result = await ipcRenderer.invoke('check-ai-connection-simple');
        console.log('✅ [RENDERER] Simple test result:', result);
        
        const statusText = document.querySelector('.status-text');
        statusText.textContent = result.connected ? 
            `✅ Simple test: ${result.status}` : 
            `❌ Simple test: ${result.status}`;
            
        showNotification(
            result.connected ? 'Simple connection test passed' : 'Simple connection test failed', 
            result.connected ? 'success' : 'warning'
        );
    } catch (error) {
        console.log('❌ [RENDERER] Simple test failed:', error);
        showNotification('Simple test failed: ' + error.message, 'error');
    }
}

async function testIPC() {
    console.log('🧪 [RENDERER] Starting IPC test...');
    
    try {
        console.log('🧪 [RENDERER] Calling test-handler...');
        const result = await ipcRenderer.invoke('test-handler');
        console.log('✅ [RENDERER] IPC test result:', result);
        
        const statusText = document.querySelector('.status-text');
        statusText.textContent = `✅ IPC Test: ${result.message}`;
        
        showNotification('IPC test passed successfully', 'success');
    } catch (error) {
        console.log('❌ [RENDERER] IPC test failed:', error);
        showNotification('IPC test failed: ' + error.message, 'error');
    }
}

function showLoading(show, message = 'Generating interview questions...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('p');
    
    if (show) {
        loadingText.textContent = message;
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function showNotification(message, type = 'info') {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Define colors for different notification types
    const colors = {
        error: { bg: '#fed7d7', color: '#c53030', border: '#c53030' },
        warning: { bg: '#fefcbf', color: '#744210', border: '#ecc94b' },
        success: { bg: '#c6f6d5', color: '#22543d', border: '#48bb78' },
        info: { bg: '#bee3f8', color: '#2a69ac', border: '#3182ce' }
    };
    
    const colorSet = colors[type] || colors.info;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${colorSet.bg};
        color: ${colorSet.color};
        border-radius: 8px;
        border-left: 4px solid ${colorSet.border};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .warning-banner {
        background: #fefcbf;
        color: #744210;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
        border-left: 4px solid #ecc94b;
        text-align: center;
        font-weight: 500;
    }
    
    .questions-preview {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .question-item {
        background: #f7fafc;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 6px;
        border-left: 3px solid #667eea;
    }
    
    .question-detail {
        padding: 5px 15px;
        color: #718096;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// AI Provider Management Functions
async function onProviderChange() {
    const providerSelect = document.getElementById('ai-provider');
    const selectedProvider = providerSelect.value;
    
    console.log(`🔄 Provider changed to: ${selectedProvider}`);
    
    // Show/hide API key input for OpenAI
    const providerConfig = document.getElementById('provider-config');
    const apiKeyInput = document.getElementById('api-key');
    
    if (selectedProvider === 'openai') {
        providerConfig.style.display = 'block';
        apiKeyInput.required = true;
    } else {
        providerConfig.style.display = 'none';
        apiKeyInput.required = false;
        apiKeyInput.value = '';
    }
    
    // Update provider status
    updateProviderStatus('loading', 'Switching provider...');
    
    try {
        const apiKey = selectedProvider === 'openai' ? apiKeyInput.value : null;
        const result = await ipcRenderer.invoke('set-ai-provider', { 
            providerId: selectedProvider, 
            apiKey: apiKey 
        });
        
        if (result.success) {
            updateProviderStatus('connected', `${result.provider.name} selected`);
            showNotification(`Switched to ${result.provider.name}`, 'success');
            
            // Reload models for the new provider
            await loadAvailableModels();
        } else {
            updateProviderStatus('error', result.error);
            showNotification(`Failed to switch provider: ${result.error}`, 'error');
        }
    } catch (error) {
        updateProviderStatus('error', 'Switch failed');
        showNotification(`Provider switch failed: ${error.message}`, 'error');
    }
}

async function testAIProvider() {
    const providerSelect = document.getElementById('ai-provider');
    const selectedProvider = providerSelect.value;
    const apiKeyInput = document.getElementById('api-key');
    
    updateProviderStatus('loading', 'Testing connection...');
    
    try {
        const apiKey = selectedProvider === 'openai' ? apiKeyInput.value : null;
        
        if (selectedProvider === 'openai' && !apiKey) {
            updateProviderStatus('error', 'API key required for OpenAI');
            showNotification('Please enter your OpenAI API key', 'warning');
            return;
        }
        
        const result = await ipcRenderer.invoke('test-ai-provider', { 
            providerId: selectedProvider, 
            apiKey: apiKey 
        });
        
        if (result.success) {
            updateProviderStatus('connected', result.message);
            showNotification(`✅ ${result.message}`, 'success');
        } else {
            updateProviderStatus('error', result.error);
            showNotification(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        updateProviderStatus('error', 'Test failed');
        showNotification(`Connection test failed: ${error.message}`, 'error');
    }
}

function updateProviderStatus(status, message) {
    const statusElement = document.getElementById('provider-status');
    const statusIndicator = statusElement.querySelector('.status-indicator');
    const statusText = statusElement.querySelector('.status-text');
    
    // Remove existing status classes
    statusElement.classList.remove('connected', 'error', 'loading');
    
    // Add new status class
    statusElement.classList.add(status);
    
    // Update indicator and text
    switch (status) {
        case 'connected':
            statusIndicator.textContent = '✅';
            break;
        case 'error':
            statusIndicator.textContent = '❌';
            break;
        case 'loading':
            statusIndicator.textContent = '🔄';
            break;
    }
    
    statusText.textContent = message;
}

async function loadCurrentAIProvider() {
    try {
        const result = await ipcRenderer.invoke('get-ai-providers');
        
        if (result.success) {
            const providerSelect = document.getElementById('ai-provider');
            const currentProvider = result.providers.find(p => p.isCurrent);
            
            if (currentProvider) {
                providerSelect.value = currentProvider.id;
                updateProviderStatus('connected', `${currentProvider.name} (Current)`);
                
                // Show API key input if OpenAI is selected
                if (currentProvider.id === 'openai') {
                    document.getElementById('provider-config').style.display = 'block';
                    document.getElementById('api-key').required = true;
                }
            }
        }
    } catch (error) {
        console.error('Error loading current AI provider:', error);
        updateProviderStatus('error', 'Failed to load provider info');
    }
}

// Interview navigation and state management
function displayCurrentQuestion() {
    if (!interviewSession) return;
    const question = interviewSession.getCurrentQuestion();
    document.getElementById('interview-question').innerHTML = question.text;
    answerEditor.setValue(interviewSession.getCurrentAnswer());
}

function saveCurrentAnswer(answer) {
    if (interviewSession) {
        interviewSession.saveAnswer(answer);
    }
}

function getCurrentQuestion() {
    return interviewSession ? interviewSession.getCurrentQuestion() : null;
}

function getCurrentAnswer() {
    return interviewSession ? interviewSession.getCurrentAnswer() : '';
}

function goToQuestion(index) {
    if (interviewSession) {
        interviewSession.goTo(index);
    }
}

function nextQuestion() {
    if (interviewSession) {
        interviewSession.next();
    }
}

function prevQuestion() {
    if (interviewSession) {
        interviewSession.prev();
    }
}

function isFirstQuestion() {
    return interviewSession ? interviewSession.isFirst() : true;
}

function isLastQuestion() {
    return interviewSession ? interviewSession.isLast() : false;
}

function formatQuestionsPreview() {
    return interviewSession ? interviewSession.formatQuestionsPreview() : '';
}
