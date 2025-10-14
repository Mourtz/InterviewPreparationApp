/**
 * Interview Interface - Refactored Main Controller
 * 
 * This file orchestrates the interview session using modular components.
 * It handles initialization, event coordination, and overall session management.
 */

const { ipcRenderer } = require('electron');

// Import modular components
const { parseQuestionsFromText, getEmergencyQuestions } = require('./modules/questionParser');
const { initializeEditors, getCurrentAnswer, getCurrentNotes } = require('./modules/editorManager');
const { 
    setQuestions, 
    displayQuestion, 
    nextQuestion, 
    previousQuestion, 
    getQuestions, 
    getAnswers, 
    getProgress,
    showNotification 
} = require('./modules/navigationManager');
const { initializeTimer, getTimerState } = require('./modules/timerManager');
const { evaluateAnswer, displayEvaluation, exportResults } = require('./modules/evaluationManager');

// Global state
let interviewData = {};
let evaluations = [];

// Initialize the interview interface
async function initializeInterview() {
    console.log('🎬 Initializing interview interface...');
    
    try {
        // Get interview data from main process
        interviewData = await ipcRenderer.invoke('get-interview-data');
        console.log('📋 Interview data received:', interviewData);
        
        // Parse questions from the generated text
        const questions = parseQuestionsFromText(interviewData.questions || '');
        if (questions.length === 0) {
            console.warn('⚠️ No questions parsed, using emergency questions');
            questions = getEmergencyQuestions();
        }
        
        // Initialize components
        setQuestions(questions);
        initializeEditors(interviewData);
        initializeTimer(interviewData.duration || 60);
        
        // Initialize evaluations array
        evaluations = new Array(questions.length).fill(null);
        
        // Display first question
        displayQuestion(0);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update interview info display
        updateInterviewInfo();
        
        console.log('✅ Interview interface initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize interview:', error);
        showNotification('Failed to initialize interview. Please restart.', 'error');
    }
}

function setupEventListeners() {
    // Navigation buttons
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    const finishButton = document.getElementById('finish-interview');
    
    if (prevButton) {
        prevButton.addEventListener('click', previousQuestion);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const questions = getQuestions();
            const currentIndex = require('./modules/navigationManager').getCurrentQuestionIndex();
            
            if (currentIndex >= questions.length - 1) {
                // Last question - finish interview
                finishInterview();
            } else {
                nextQuestion();
            }
        });
    }
    
    if (finishButton) {
        finishButton.addEventListener('click', finishInterview);
    }
    
    // Evaluation button
    const evaluateButton = document.getElementById('evaluate-answer');
    if (evaluateButton) {
        evaluateButton.addEventListener('click', evaluateCurrentAnswer);
    }
    
    // Export button
    const exportButton = document.getElementById('export-results');
    if (exportButton) {
        exportButton.addEventListener('click', handleExportResults);
    }
    
    // New interview button
    const newInterviewButton = document.getElementById('new-interview');
    if (newInterviewButton) {
        newInterviewButton.addEventListener('click', startNewInterview);
    }
    
    // Timer controls
    const pauseButton = document.getElementById('pause-timer');
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            const timerManager = require('./modules/timerManager');
            const state = timerManager.getTimerState();
            if (state.isPaused) {
                timerManager.resumeTimer();
            } else {
                timerManager.pauseTimer();
            }
        });
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Listen for interview finish event
    document.addEventListener('interview-finished', handleInterviewFinished);
    
    // Auto-save answers periodically
    setInterval(autoSaveAnswers, 30000); // Every 30 seconds
}

function handleKeyboardShortcuts(event) {
    // Prevent default browser shortcuts that might interfere
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                autoSaveAnswers();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                previousQuestion();
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextQuestion();
                break;
            case 'Enter':
                if (event.shiftKey) {
                    event.preventDefault();
                    evaluateCurrentAnswer();
                }
                break;
        }
    }
    
    // F-key shortcuts
    switch (event.key) {
        case 'F9':
            event.preventDefault();
            evaluateCurrentAnswer();
            break;
        case 'F10':
            event.preventDefault();
            finishInterview();
            break;
    }
}

async function evaluateCurrentAnswer() {
    const questions = getQuestions();
    const answers = getAnswers();
    const currentIndex = require('./modules/navigationManager').getCurrentQuestionIndex();
    
    if (!questions[currentIndex] || !answers[currentIndex]) {
        showNotification('No answer to evaluate', 'warning');
        return;
    }
    
    const evaluateButton = document.getElementById('evaluate-answer');
    if (evaluateButton) {
        evaluateButton.disabled = true;
        evaluateButton.textContent = '🤖 Evaluating...';
    }
    
    try {
        const evaluation = await evaluateAnswer(
            questions[currentIndex], 
            answers[currentIndex], 
            currentIndex
        );
        
        evaluations[currentIndex] = evaluation;
        displayEvaluation(evaluation, currentIndex);
        
        showNotification('Answer evaluated successfully', 'success');
        
    } catch (error) {
        console.error('Evaluation error:', error);
        showNotification('Failed to evaluate answer', 'error');
    } finally {
        if (evaluateButton) {
            evaluateButton.disabled = false;
            evaluateButton.textContent = '🤖 Evaluate Answer';
        }
    }
}

function autoSaveAnswers() {
    try {
        // Save current answer
        require('./modules/navigationManager').saveCurrentAnswer();
        
        // Save to persistent storage via IPC
        const questions = getQuestions();
        const answers = getAnswers();
        const progress = getProgress();
        
        ipcRenderer.invoke('save-interview-progress', {
            questions,
            answers,
            evaluations,
            progress,
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('Failed to save progress:', error);
        });
        
        console.log('💾 Auto-saved interview progress');
    } catch (error) {
        console.error('Auto-save error:', error);
    }
}

function handleExportResults() {
    const questions = getQuestions();
    const answers = getAnswers();
    
    exportResults(questions, answers, evaluations, interviewData);
}

async function startNewInterview() {
    if (confirm('Are you sure you want to start a new interview? Current progress will be lost.')) {
        try {
            await ipcRenderer.invoke('end-interview', {});
            window.close();
        } catch (error) {
            console.error('Error starting new interview:', error);
            showNotification('Failed to start new interview', 'error');
        }
    }
}

function finishInterview() {
    // Save final answers
    autoSaveAnswers();
    
    const questions = getQuestions();
    const answers = getAnswers();
    const progress = getProgress();
    const timerState = getTimerState();
    
    // Show completion summary
    const summary = `
        Interview Completed!
        
        Questions Answered: ${progress.answered}/${progress.total}
        Completion Rate: ${progress.percentage}%
        Time Spent: ${require('./modules/timerManager').formatTime(timerState.timeSpent)}
        
        Would you like to export your results?
    `;
    
    if (confirm(summary)) {
        handleExportResults();
    }
    
    // Stop timer
    require('./modules/timerManager').stopTimer();
    
    // Show final results screen
    showFinalResults();
}

function handleInterviewFinished(event) {
    console.log('🏁 Interview finished event received:', event.detail);
    finishInterview();
}

function showFinalResults() {
    const questions = getQuestions();
    const answers = getAnswers();
    const progress = getProgress();
    
    // Hide interview interface, show results
    const interviewContainer = document.getElementById('interview-container');
    const resultsContainer = document.getElementById('results-container');
    
    if (interviewContainer) {
        interviewContainer.style.display = 'none';
    }
    
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        
        // Populate results summary
        const summaryEl = document.getElementById('results-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <h2>Interview Complete</h2>
                <div class="results-stats">
                    <div class="stat">
                        <span class="stat-value">${progress.answered}</span>
                        <span class="stat-label">Questions Answered</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${progress.percentage}%</span>
                        <span class="stat-label">Completion Rate</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${evaluations.filter(e => e && e.score >= 6).length}</span>
                        <span class="stat-label">Passed Questions</span>
                    </div>
                </div>
            `;
        }
    }
}

function updateInterviewInfo() {
    // Update interview metadata display
    const interviewTitle = document.getElementById('interview-title');
    const interviewMeta = document.getElementById('interview-meta');
    
    if (interviewTitle) {
        interviewTitle.textContent = `${interviewData.programmingLanguage || 'General'} Interview`;
    }
    
    if (interviewMeta) {
        interviewMeta.innerHTML = `
            <div>Duration: ${interviewData.duration || 60} minutes</div>
            <div>Difficulty: ${interviewData.difficulty || 'Medium'}</div>
            <div>Questions: ${getQuestions().length}</div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeInterview);

// Handle window close
window.addEventListener('beforeunload', (event) => {
    // Auto-save before closing
    autoSaveAnswers();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeInterview,
        evaluateCurrentAnswer,
        finishInterview,
        autoSaveAnswers
    };
}