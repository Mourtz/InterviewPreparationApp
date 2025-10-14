/**
 * Evaluation Manager Module
 * Handles answer evaluation, feedback display, and results export
 */

const { ipcRenderer } = require('electron');

async function evaluateAnswer(question, answer, questionIndex) {
    if (!answer || answer.trim() === '') {
        console.log('⚠️ No answer provided for evaluation');
        return {
            success: false,
            error: 'No answer provided',
            fallback: true
        };
    }
    
    console.log(`🤖 Evaluating answer for question ${questionIndex + 1}...`);
    
    try {
        // Try AI evaluation first
        const evaluation = await ipcRenderer.invoke('evaluate-answer', {
            question: question.question,
            answer: answer,
            questionIndex: questionIndex
        });
        
        if (evaluation.success) {
            console.log('✅ AI evaluation completed successfully');
            return evaluation;
        } else {
            console.log('⚠️ AI evaluation failed, using fallback');
            return generateFallbackEvaluation(question, answer);
        }
    } catch (error) {
        console.error('❌ Evaluation error:', error);
        return generateFallbackEvaluation(question, answer);
    }
}

function generateFallbackEvaluation(question, answer) {
    console.log('🔄 Generating fallback evaluation...');
    
    const answerLength = answer.trim().length;
    let score = 5; // Default neutral score
    let feedback = '';
    
    // Basic scoring based on answer characteristics
    if (answerLength === 0) {
        score = 0;
        feedback = "No answer provided.";
    } else if (answerLength < 50) {
        score = 3;
        feedback = "Answer is quite brief. Consider providing more detail and explanation.";
    } else if (answerLength < 200) {
        score = 6;
        feedback = "Good effort! The answer shows understanding but could benefit from more comprehensive explanation.";
    } else {
        score = 7;
        feedback = "Comprehensive answer provided. Shows good effort and detail.";
    }
    
    // Check for code patterns (basic detection)
    const hasCode = /function|def |class |if |for |while |return/i.test(answer);
    if (hasCode && question.question.toLowerCase().includes('function')) {
        score += 1;
        feedback += " Code implementation detected, which is appropriate for this question.";
    }
    
    // Check for technical keywords
    const technicalKeywords = ['algorithm', 'complexity', 'efficient', 'optimize', 'data structure'];
    const keywordCount = technicalKeywords.filter(keyword => 
        answer.toLowerCase().includes(keyword)
    ).length;
    
    if (keywordCount > 0) {
        score += Math.min(keywordCount, 2);
        feedback += ` Good use of technical terminology.`;
    }
    
    // Ensure score is within bounds
    score = Math.min(Math.max(score, 0), 10);
    
    const fallbackEvaluation = `
**Automated Evaluation (AI evaluation unavailable)**

**Score: ${score}/10**

**Overall Assessment:**
${feedback}

**Strengths:**
- Answer was provided within the time limit
${hasCode ? '- Included code implementation' : ''}
${keywordCount > 0 ? '- Used relevant technical terminology' : ''}

**Areas for Improvement:**
${answerLength < 100 ? '- Could provide more detailed explanation' : ''}
${!hasCode && question.question.toLowerCase().includes('function') ? '- Consider including code examples' : ''}
- Manual review recommended for comprehensive feedback

**Note:** This is an automated fallback evaluation. For detailed technical assessment, please have this answer reviewed by a technical interviewer.
    `.trim();
    
    return {
        success: true,
        evaluation: fallbackEvaluation,
        score: score,
        fallback: true,
        model: 'fallback-evaluator'
    };
}

function displayEvaluation(evaluation, questionIndex) {
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackContent = document.getElementById('feedback-content');
    const scoreValue = document.getElementById('score-value');
    const passFailStatus = document.getElementById('pass-fail-status');
    
    if (!feedbackContainer || !feedbackContent) {
        console.error('❌ Feedback elements not found');
        return;
    }
    
    // Show feedback container
    feedbackContainer.style.display = 'block';
    
    // Display evaluation
    const isFallback = evaluation.fallback === true;
    const modelUsed = evaluation.model || 'Unknown';
    const evaluationText = evaluation.evaluation || evaluation.error || 'No evaluation available';
    
    const formattedFeedback = formatEvaluationText(evaluationText, isFallback, modelUsed);
    feedbackContent.innerHTML = formattedFeedback;
    
    // Display score
    if (scoreValue && evaluation.score !== undefined) {
        scoreValue.textContent = `${evaluation.score}/10`;
        
        // Color code the score
        if (evaluation.score >= 8) {
            scoreValue.style.color = '#38a169'; // Green
        } else if (evaluation.score >= 6) {
            scoreValue.style.color = '#d69e2e'; // Orange
        } else {
            scoreValue.style.color = '#e53e3e'; // Red
        }
    }
    
    // Display pass/fail status
    if (passFailStatus && evaluation.score !== undefined) {
        const passed = evaluation.score >= 6;
        passFailStatus.textContent = passed ? 'PASS' : 'NEEDS IMPROVEMENT';
        passFailStatus.className = passed ? 'status-pass' : 'status-fail';
        passFailStatus.style.color = passed ? '#38a169' : '#e53e3e';
    }
    
    console.log(`📊 Displayed evaluation for question ${questionIndex + 1}`);
}

function formatEvaluationText(text, isFallback, modelUsed = null) {
    const modelInfo = modelUsed ? `<div class="model-info">Evaluated using: ${modelUsed}</div>` : '';
    
    if (isFallback) {
        return `
            <div class="warning-banner">⚠️ AI evaluation not available - manual review required</div>
            ${modelInfo}
            <div class="feedback-text" style="color: #4a5568;">${text.replace(/\n/g, '<br>')}</div>
        `;
    }
    
    // Enhanced formatting for AI-generated feedback
    let formatted = text;
    
    // Format numbered sections
    formatted = formatted.replace(/(\d+\.\s*[A-Z\s]+:)/g, '<h4 class="feedback-header">$1</h4>');
    
    // Format pass/fail status
    formatted = formatted.replace(/(PASS|FAIL)/gi, '<strong class="status-highlight">$1</strong>');
    
    // Format score
    formatted = formatted.replace(/Score:\s*(\d+)/gi, '<strong class="score-highlight">Score: $1</strong>');
    
    // Format section headers
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert newlines to breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return `
        ${modelInfo}
        <div class="feedback-text" style="color: #4a5568;">${formatted}</div>
    `;
}

function exportResults(questions, answers, evaluations, interviewData) {
    const results = {
        metadata: {
            exportDate: new Date().toISOString(),
            interviewDate: interviewData.startTime || new Date().toISOString(),
            duration: `${interviewData.duration || 60} minutes`,
            programmingLanguage: interviewData.programmingLanguage || 'Not specified',
            candidateName: interviewData.candidateName || 'Anonymous'
        },
        interview: {
            questionsAnswered: answers.filter(answer => answer && answer.trim()).length,
            totalQuestions: questions.length,
            completionRate: Math.round((answers.filter(answer => answer && answer.trim()).length / questions.length) * 100)
        },
        questions: questions.map((q, index) => ({
            number: index + 1,
            question: q.question,
            answer: answers[index] || '',
            evaluation: evaluations[index] || null
        })),
        summary: {
            averageScore: calculateAverageScore(evaluations),
            totalScore: calculateTotalScore(evaluations),
            passedQuestions: evaluations.filter(e => e && e.score >= 6).length,
            failedQuestions: evaluations.filter(e => e && e.score < 6).length
        }
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `interview-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Results exported successfully', 'success');
    console.log('📁 Interview results exported');
}

function calculateAverageScore(evaluations) {
    const validEvaluations = evaluations.filter(e => e && typeof e.score === 'number');
    if (validEvaluations.length === 0) return 0;
    
    const total = validEvaluations.reduce((sum, e) => sum + e.score, 0);
    return Math.round((total / validEvaluations.length) * 100) / 100;
}

function calculateTotalScore(evaluations) {
    const validEvaluations = evaluations.filter(e => e && typeof e.score === 'number');
    return validEvaluations.reduce((sum, e) => sum + e.score, 0);
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

// Add required CSS for evaluation display
const style = document.createElement('style');
style.textContent = `
    .warning-banner {
        background: #fef5e7;
        border: 1px solid #f6ad55;
        color: #744210;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 15px;
        font-weight: bold;
    }
    
    .model-info {
        background: #edf2f7;
        color: #4a5568;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 0.9rem;
    }
    
    .feedback-header {
        color: #2d3748;
        margin: 15px 0 8px 0;
        font-size: 1.1rem;
    }
    
    .status-highlight {
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: bold;
    }
    
    .score-highlight {
        color: #2b6cb0;
        font-weight: bold;
    }
    
    .status-pass {
        background: #c6f6d5;
        color: #22543d;
    }
    
    .status-fail {
        background: #fed7d7;
        color: #c53030;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

module.exports = {
    evaluateAnswer,
    displayEvaluation,
    exportResults,
    generateFallbackEvaluation,
    formatEvaluationText,
    calculateAverageScore,
    calculateTotalScore
};