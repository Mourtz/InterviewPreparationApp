// Utility for building AI prompts
function buildQuestionPrompt({ questionCount, language, difficulty, jobDescription, cvContent, additionalDetails }) {
    let prompt = `Generate ${questionCount} technical interview questions for a ${difficulty}-level ${language} developer position.`;
    if (jobDescription) {
        prompt += `\n\nJob Description:\n${jobDescription}`;
    }
    if (cvContent) {
        prompt += `\n\nCandidate's CV/Resume:\n${cvContent}`;
    }
    if (additionalDetails) {
        prompt += `\n\nAdditional Requirements:\n${additionalDetails}`;
    }
    prompt += `\n\nPlease generate exactly ${questionCount} questions that are:\n1. Relevant to the job description and candidate's background\n2. Appropriate for ${difficulty}-level experience\n3. Mix of theoretical and practical questions\n4. Include at least one coding problem if appropriate\n5. Progressive in difficulty\n\nFormat each question as:\nQUESTION X: [Question text here]\n\nOnly return the questions, no additional text.`;
    return prompt;
}

function buildEvaluationPrompt({ duration, language, difficulty, jobDescription, questions, answers }) {
    let prompt = `Please evaluate this technical interview performance and provide detailed feedback.\n\n`;
    prompt += `Interview Details:\n`;
    prompt += `- Duration: ${duration} minutes\n`;
    prompt += `- Programming Language: ${language}\n`;
    prompt += `- Difficulty Level: ${difficulty}\n\n`;
    if (jobDescription) {
        prompt += `Job Description:\n${jobDescription}\n\n`;
    }
    questions.forEach((question, index) => {
        prompt += `QUESTION ${index + 1}: ${question.content}\n`;
        prompt += `ANSWER: ${answers[index] || 'No answer provided'}\n\n`;
    });
    prompt += `Please provide:\n1. A numerical score from 0-100\n2. PASS or FAIL recommendation\n3. Detailed feedback on each answer\n4. Overall strengths and weaknesses\n5. Specific recommendations for improvement\n\nFormat your response as:\nSCORE: [0-100]\nRESULT: [PASS/FAIL]\nFEEDBACK: [Detailed feedback here]`;
    return prompt;
}

module.exports = { buildQuestionPrompt, buildEvaluationPrompt };
