/**
 * Navigation Manager Module
 * Handles question navigation, progress tracking, and UI updates
 */

const { formatQuestionContent } = require('./questionParser');
const { applyQuestionProtection } = require('./copyProtection');
const { loadAnswerContent } = require('./editorManager');

let currentQuestionIndex = 0;
let questions = [];
let answers = [];
let highestQuestionReached = 0;

function setQuestions(questionsArray) {
    questions = questionsArray;
    answers = new Array(questions.length).fill('');
    currentQuestionIndex = 0;
    highestQuestionReached = 0;
}

function updateHighestReachedQuestion(index) {
    if (index > highestQuestionReached) {
        highestQuestionReached = index;
        console.log(`📈 Updated highest reached question to: ${index + 1}`);
    }
}

function displayQuestion(index) {
    if (!questions || questions.length === 0) {
        console.error('❌ No questions available to display');
        return;
    }
    
    if (index < 0 || index >= questions.length) {
        console.error(`❌ Invalid question index: ${index}`);
        return;
    }
    
    currentQuestionIndex = index;
    
    // Track the highest question reached to prevent spoilers
    updateHighestReachedQuestion(index);
    
    const question = questions[index];
    
    // Update question display
    const questionContent = document.getElementById('question-content');
    if (questionContent) {
        questionContent.innerHTML = formatQuestionContent(question.question);
    }
    
    const currentQuestionEl = document.getElementById('current-question');
    if (currentQuestionEl) {
        currentQuestionEl.textContent = index + 1;
    }
    
    // Apply copy protection to question content
    setTimeout(() => {
        applyQuestionProtection(questionContent);
    }, 10);
    
    // Update progress
    const progressPercentage = ((index + 1) / questions.length) * 100;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Load existing answer if any
    if (answers[index]) {
        loadAnswerContent(answers[index]);
    } else {
        loadAnswerContent('');
    }
    
    // Update questions overview
    updateQuestionsOverview();
    
    // Update navigation button states
    updateNavigationButtons();
    
    console.log(`📍 Displayed question ${index + 1} of ${questions.length}`);
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    
    // Update previous button
    if (prevButton) {
        if (currentQuestionIndex > 0) {
            prevButton.disabled = false;
            prevButton.textContent = '⬅️ Previous Question';
            prevButton.title = 'Go to previous question';
        } else {
            prevButton.disabled = true;
            prevButton.textContent = '⬅️ Previous Question';
            prevButton.title = 'No previous question';
        }
    }
    
    // Update next button
    if (nextButton) {
        if (currentQuestionIndex < questions.length - 1) {
            nextButton.textContent = '➡️ Next Question';
            nextButton.title = 'Proceed to next question';
        } else {
            nextButton.textContent = '🏁 Finish Interview';
            nextButton.title = 'Complete the interview';
        }
    }
}

function updateQuestionsOverview() {
    const questionsOverview = document.getElementById('questions-overview');
    if (!questionsOverview) return;
    
    let overviewHTML = '<div class="questions-list">';
    
    questions.forEach((question, index) => {
        const isAnswered = answers[index] && answers[index].trim().length > 0;
        const isCurrent = index === currentQuestionIndex;
        const isAccessible = index <= highestQuestionReached;
        
        let statusClass = '';
        let statusIcon = '';
        
        if (isCurrent) {
            statusClass = 'current';
            statusIcon = '📍';
        } else if (isAnswered) {
            statusClass = 'answered';
            statusIcon = '✅';
        } else if (isAccessible) {
            statusClass = 'accessible';
            statusIcon = '❓';
        } else {
            statusClass = 'locked';
            statusIcon = '🔒';
        }
        
        overviewHTML += `
            <div class="question-item ${statusClass}" 
                 onclick="${isAccessible ? `navigateToQuestion(${index})` : ''}"
                 title="${isAccessible ? `Go to question ${index + 1}` : 'Complete previous questions first'}">
                <span class="question-number">${index + 1}</span>
                <span class="question-status">${statusIcon}</span>
                <span class="question-preview">${question.question.substring(0, 50)}...</span>
            </div>
        `;
    });
    
    overviewHTML += '</div>';
    questionsOverview.innerHTML = overviewHTML;
}

function navigateToQuestion(index) {
    // Prevent navigation to questions beyond the highest reached
    if (index > highestQuestionReached) {
        showNotification('Complete previous questions first', 'warning');
        return;
    }
    
    // Save current answer before navigating
    saveCurrentAnswer();
    
    displayQuestion(index);
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        saveCurrentAnswer();
        displayQuestion(currentQuestionIndex + 1);
    } else {
        // This is the last question, trigger finish
        finishInterview();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        saveCurrentAnswer();
        displayQuestion(currentQuestionIndex - 1);
    }
}

function saveCurrentAnswer() {
    const { getCurrentAnswer } = require('./editorManager');
    const currentAnswer = getCurrentAnswer();
    if (currentAnswer !== undefined) {
        answers[currentQuestionIndex] = currentAnswer;
        console.log(`💾 Saved answer for question ${currentQuestionIndex + 1}`);
    }
}

function finishInterview() {
    // Save current answer
    saveCurrentAnswer();
    
    // Show completion confirmation
    const answeredCount = answers.filter(answer => answer && answer.trim()).length;
    const totalQuestions = questions.length;
    
    const message = `Interview completed!\n\nAnswered: ${answeredCount}/${totalQuestions} questions\n\nProceed to evaluation?`;
    
    if (confirm(message)) {
        // Trigger interview completion
        const event = new CustomEvent('interview-finished', {
            detail: {
                questions,
                answers,
                currentQuestionIndex,
                highestQuestionReached
            }
        });
        document.dispatchEvent(event);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#fed7d7' : type === 'warning' ? '#fefcbf' : type === 'success' ? '#c6f6d5' : '#bee3f8'};
        color: ${type === 'error' ? '#c53030' : type === 'warning' ? '#744210' : type === 'success' ? '#22543d' : '#2a69ac'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        font-size: 0.9rem;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getCurrentQuestionIndex() {
    return currentQuestionIndex;
}

function getQuestions() {
    return questions;
}

function getAnswers() {
    return answers;
}

function getProgress() {
    const answeredCount = answers.filter(answer => answer && answer.trim()).length;
    return {
        current: currentQuestionIndex + 1,
        total: questions.length,
        answered: answeredCount,
        percentage: Math.round((answeredCount / questions.length) * 100)
    };
}

// Make navigateToQuestion globally accessible for onclick handlers
if (typeof window !== 'undefined') {
    window.navigateToQuestion = navigateToQuestion;
}

module.exports = {
    setQuestions,
    displayQuestion,
    navigateToQuestion,
    nextQuestion,
    previousQuestion,
    saveCurrentAnswer,
    finishInterview,
    updateQuestionsOverview,
    updateNavigationButtons,
    getCurrentQuestionIndex,
    getQuestions,
    getAnswers,
    getProgress,
    showNotification
};