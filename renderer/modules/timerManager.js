/**
 * Timer Manager Module
 * Handles interview timing, countdown, and time-related UI updates
 */

let startTime = Date.now();
let timer = null;
let timeRemaining = 0;
let isPaused = false;
let interviewDuration = 0; // in milliseconds

function initializeTimer(durationMinutes) {
    interviewDuration = durationMinutes * 60 * 1000; // Convert to milliseconds
    timeRemaining = interviewDuration;
    startTime = Date.now();
    isPaused = false;
    
    console.log(`⏰ Timer initialized: ${durationMinutes} minutes (${interviewDuration}ms)`);
    
    updateTimerDisplay();
    startTimer();
}

function startTimer() {
    if (timer) {
        clearInterval(timer);
    }
    
    timer = setInterval(() => {
        if (!isPaused) {
            const elapsed = Date.now() - startTime;
            timeRemaining = Math.max(0, interviewDuration - elapsed);
            
            updateTimerDisplay();
            
            // Check for time warnings
            checkTimeWarnings();
            
            if (timeRemaining <= 0) {
                handleTimeUp();
            }
        }
    }, 1000);
    
    console.log('▶️ Timer started');
}

function pauseTimer() {
    isPaused = true;
    const pauseButton = document.getElementById('pause-timer');
    if (pauseButton) {
        pauseButton.textContent = '▶️ Resume';
        pauseButton.onclick = resumeTimer;
    }
    console.log('⏸️ Timer paused');
}

function resumeTimer() {
    isPaused = false;
    // Adjust start time to account for pause duration
    const elapsed = interviewDuration - timeRemaining;
    startTime = Date.now() - elapsed;
    
    const pauseButton = document.getElementById('pause-timer');
    if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause';
        pauseButton.onclick = pauseTimer;
    }
    console.log('▶️ Timer resumed');
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isPaused = false;
    console.log('⏹️ Timer stopped');
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    const progressElement = document.getElementById('timer-progress');
    
    if (timerElement) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timerElement.textContent = timeString;
        
        // Change color based on remaining time
        if (timeRemaining <= 300000) { // 5 minutes
            timerElement.style.color = '#e53e3e'; // Red
        } else if (timeRemaining <= 600000) { // 10 minutes
            timerElement.style.color = '#d69e2e'; // Orange
        } else {
            timerElement.style.color = '#38a169'; // Green
        }
    }
    
    if (progressElement) {
        const progressPercentage = ((interviewDuration - timeRemaining) / interviewDuration) * 100;
        progressElement.style.width = `${progressPercentage}%`;
        
        // Change progress bar color based on remaining time
        if (timeRemaining <= 300000) { // 5 minutes
            progressElement.style.backgroundColor = '#e53e3e'; // Red
        } else if (timeRemaining <= 600000) { // 10 minutes
            progressElement.style.backgroundColor = '#d69e2e'; // Orange
        } else {
            progressElement.style.backgroundColor = '#38a169'; // Green
        }
    }
}

function checkTimeWarnings() {
    const remainingMinutes = Math.floor(timeRemaining / 60000);
    
    // 10-minute warning
    if (timeRemaining <= 600000 && timeRemaining > 599000) {
        showTimeWarning('10 minutes remaining', 'warning');
    }
    
    // 5-minute warning
    if (timeRemaining <= 300000 && timeRemaining > 299000) {
        showTimeWarning('5 minutes remaining', 'warning');
    }
    
    // 1-minute warning
    if (timeRemaining <= 60000 && timeRemaining > 59000) {
        showTimeWarning('1 minute remaining!', 'error');
    }
}

function showTimeWarning(message, type) {
    // Create warning notification
    const warning = document.createElement('div');
    warning.className = `time-warning time-warning-${type}`;
    warning.innerHTML = `
        <div class="warning-icon">⏰</div>
        <div class="warning-message">${message}</div>
        <button class="warning-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === 'error' ? '#fed7d7' : '#fefcbf'};
        color: ${type === 'error' ? '#c53030' : '#744210'};
        border: 2px solid ${type === 'error' ? '#e53e3e' : '#d69e2e'};
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 1.1rem;
        font-weight: bold;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 5000;
        animation: warningPulse 0.5s ease-in-out;
    `;
    
    document.body.appendChild(warning);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(warning)) {
            warning.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(warning)) {
                    document.body.removeChild(warning);
                }
            }, 300);
        }
    }, 5000);
    
    // Play warning sound if available
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmJIBTua2fPHaB4Ja6vl2pxNGgpSqeXv1mgcEjqV2vS2aSAGOIrT9MNxHgU+js3yzXQkBS1+0PLWfSEHOojN9MBxIgc/js7yznEhBSuCz/LVgSAGNoXQ8sV1JgQvgs3yyn4pBSl+0fLQgyIGNKDZ8b9wIwU4jc3yzXElBTCFz/LWfSADOIvO8sJwIgU6kM3yze0kBSl+z/LdfyEGKXrQ8sJ7KgMzg9L1vcHxBSN2yfK8fTQEJnPQ9M1xJAQvgs3y');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore audio play errors
        });
    } catch (error) {
        // Ignore audio errors
    }
    
    console.log(`⚠️ Time warning: ${message}`);
}

function handleTimeUp() {
    stopTimer();
    
    // Show time's up modal
    const modal = document.createElement('div');
    modal.className = 'time-up-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>⏰ Time's Up!</h2>
            </div>
            <div class="modal-body">
                <p>The interview time has expired.</p>
                <p>Your answers have been automatically saved.</p>
                <div class="time-up-actions">
                    <button id="finish-now" class="btn btn-primary">Finish Interview</button>
                    <button id="extend-time" class="btn btn-secondary">Extend 5 Minutes</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Handle button clicks
    document.getElementById('finish-now').onclick = () => {
        document.body.removeChild(modal);
        finishInterview();
    };
    
    document.getElementById('extend-time').onclick = () => {
        document.body.removeChild(modal);
        extendTime(5); // Extend by 5 minutes
    };
    
    console.log('⏰ Time up - showing completion modal');
}

function extendTime(minutes) {
    const extensionMs = minutes * 60 * 1000;
    interviewDuration += extensionMs;
    timeRemaining += extensionMs;
    
    // Restart timer if it was stopped
    if (!timer) {
        startTimer();
    }
    
    showTimeWarning(`Time extended by ${minutes} minutes`, 'success');
    console.log(`⏰ Time extended by ${minutes} minutes`);
}

function finishInterview() {
    stopTimer();
    
    // Trigger interview completion event
    const event = new CustomEvent('interview-finished', {
        detail: {
            timeUp: true,
            totalTime: interviewDuration,
            timeSpent: interviewDuration - timeRemaining
        }
    });
    document.dispatchEvent(event);
}

function getTimeRemaining() {
    return timeRemaining;
}

function getTimeSpent() {
    return interviewDuration - timeRemaining;
}

function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getTimerState() {
    return {
        timeRemaining,
        timeSpent: getTimeSpent(),
        totalDuration: interviewDuration,
        isPaused,
        isRunning: timer !== null
    };
}

// Add CSS animations for warnings
const style = document.createElement('style');
style.textContent = `
    @keyframes warningPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .time-warning {
        user-select: none;
    }
    
    .warning-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: inherit;
        padding: 0;
        margin-left: auto;
    }
    
    .warning-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

module.exports = {
    initializeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTime,
    getTimeRemaining,
    getTimeSpent,
    formatTime,
    getTimerState
};