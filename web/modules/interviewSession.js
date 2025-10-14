// Interview session management class

class InterviewSession {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.duration = 0;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answers = {};
        this.interviewData = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.totalTime = 0;
    }

    start(questions, interviewData, duration = 3600000) { // Default 1 hour
        this.isActive = true;
        this.startTime = new Date();
        this.questions = questions;
        this.interviewData = interviewData;
        this.totalTime = duration;
        this.timeRemaining = duration;
        this.currentQuestionIndex = 0;
        this.answers = {};
        
        this.startTimer();
        
        return {
            success: true,
            message: 'Interview started successfully',
            startTime: this.startTime,
            totalQuestions: this.questions.length,
            duration: duration
        };
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining -= 1000;
                this.updateTimerDisplay();
            } else {
                this.endInterview();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60000);
        const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = display;
            
            // Add warning colors
            if (this.timeRemaining < 300000) { // Less than 5 minutes
                timerElement.classList.add('timer-warning');
            }
            if (this.timeRemaining < 60000) { // Less than 1 minute
                timerElement.classList.add('timer-critical');
            }
        }
    }

    getCurrentQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            return {
                ...this.questions[this.currentQuestionIndex],
                index: this.currentQuestionIndex,
                total: this.questions.length
            };
        }
        return null;
    }

    saveAnswer(questionId, answer) {
        this.answers[questionId] = answer;
        return {
            success: true,
            questionId: questionId,
            answerLength: answer ? answer.length : 0
        };
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return {
                success: true,
                question: this.getCurrentQuestion(),
                isLast: this.currentQuestionIndex === this.questions.length - 1
            };
        }
        return {
            success: false,
            message: 'Already at last question'
        };
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return {
                success: true,
                question: this.getCurrentQuestion(),
                isFirst: this.currentQuestionIndex === 0
            };
        }
        return {
            success: false,
            message: 'Already at first question'
        };
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestionIndex = index;
            return {
                success: true,
                question: this.getCurrentQuestion()
            };
        }
        return {
            success: false,
            message: 'Invalid question index'
        };
    }

    endInterview() {
        this.isActive = false;
        this.endTime = new Date();
        this.duration = this.endTime - this.startTime;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        return {
            success: true,
            endTime: this.endTime,
            duration: this.duration,
            questionsAnswered: Object.keys(this.answers).length,
            totalQuestions: this.questions.length,
            completionRate: (Object.keys(this.answers).length / this.questions.length) * 100
        };
    }

    getSessionData() {
        return {
            isActive: this.isActive,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.isActive ? (new Date() - this.startTime) : this.duration,
            currentQuestionIndex: this.currentQuestionIndex,
            questions: this.questions,
            answers: this.answers,
            interviewData: this.interviewData,
            timeRemaining: this.timeRemaining,
            totalTime: this.totalTime,
            progress: {
                questionsAnswered: Object.keys(this.answers).length,
                totalQuestions: this.questions.length,
                completionRate: this.questions.length > 0 ? 
                    (Object.keys(this.answers).length / this.questions.length) * 100 : 0
            }
        };
    }

    getResults() {
        return {
            duration: this.duration,
            questions: this.questions,
            answers: this.answers,
            interviewData: this.interviewData,
            metrics: {
                questionsAnswered: Object.keys(this.answers).length,
                totalQuestions: this.questions.length,
                completionRate: this.questions.length > 0 ? 
                    (Object.keys(this.answers).length / this.questions.length) * 100 : 0,
                averageAnswerLength: this.calculateAverageAnswerLength(),
                timePerQuestion: this.questions.length > 0 ? 
                    this.duration / this.questions.length : 0
            }
        };
    }

    calculateAverageAnswerLength() {
        const answers = Object.values(this.answers).filter(a => a && a.length > 0);
        if (answers.length === 0) return 0;
        
        const totalLength = answers.reduce((sum, answer) => sum + answer.length, 0);
        return totalLength / answers.length;
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resumeTimer() {
        if (this.isActive && !this.timerInterval) {
            this.startTimer();
        }
    }

    addTime(milliseconds) {
        this.timeRemaining += milliseconds;
        this.totalTime += milliseconds;
    }

    removeTime(milliseconds) {
        this.timeRemaining = Math.max(0, this.timeRemaining - milliseconds);
    }
}

module.exports = InterviewSession;