// shared/interviewSession.js
// Shared logic for question/answer state management and navigation

class InterviewSession {
    constructor(questions = []) {
        this.questions = questions;
        this.answers = new Array(questions.length).fill('');
        this.currentIndex = 0;
    }

    setQuestions(questions) {
        this.questions = questions;
        this.answers = new Array(questions.length).fill('');
        this.currentIndex = 0;
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    getCurrentAnswer() {
        return this.answers[this.currentIndex] || '';
    }

    saveAnswer(answer) {
        this.answers[this.currentIndex] = answer;
    }

    goTo(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentIndex = index;
        }
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

    isFirst() {
        return this.currentIndex === 0;
    }

    isLast() {
        return this.currentIndex === this.questions.length - 1;
    }

    formatQuestionsPreview() {
        // Returns HTML string for preview (UI can use as innerHTML)
        return this.questions.map((q, i) =>
            `<div class="preview-question"><h4>Question ${i + 1}:</h4><p>${q.content || q}</p></div>`
        ).join('');
    }
}

module.exports = { InterviewSession };
