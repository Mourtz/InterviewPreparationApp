// Utility for parsing questions from AI response
function parseQuestionsFromResponse(response) {
    const questions = [];
    const questionPattern = /QUESTION\s+(\d+):\s*(.+?)(?=QUESTION\s+\d+:|$)/gis;
    let match;
    while ((match = questionPattern.exec(response)) !== null) {
        questions.push({
            id: parseInt(match[1]),
            content: match[2].trim()
        });
    }
    // Fallback: split by numbers if pattern doesn't work
    if (questions.length === 0) {
        const lines = response.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            if (line.match(/^\d+\.|^Question \d+/i) || (index % 2 === 0 && lines.length > 3)) {
                questions.push({
                    id: questions.length + 1,
                    content: line.replace(/^\d+\.\s*|^Question \d+:\s*/i, '').trim()
                });
            }
        });
    }
    return questions;
}

module.exports = { parseQuestionsFromResponse };
