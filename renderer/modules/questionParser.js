/**
 * Question Parser Module
 * Handles parsing of AI-generated questions into structured format
 */

function parseQuestionsFromText(questionsText) {
    if (!questionsText || questionsText.trim() === '') {
        console.log('⚠️ Empty questions text received');
        return [];
    }
    
    console.log('📋 Parsing questions from AI response...');
    console.log('Raw questions text:', questionsText.substring(0, 500) + '...');
    
    const lines = questionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedQuestions = [];
    let currentQuestion = '';
    let questionNumber = 0;
    
    lines.forEach(line => {
        // Skip metadata lines
        if (line.includes('Duration:') || line.includes('Focus:') || line.includes('Interview Type:')) {
            return;
        }
        
        // Format 1: **Problem X: Title**
        if (line.match(/^\*\*Problem \d+:/)) {
            if (currentQuestion) {
                parsedQuestions.push({
                    question: currentQuestion.trim(),
                    answered: false
                });
            }
            questionNumber++;
            currentQuestion = line.replace(/^\*\*Problem \d+:\s*/, '').replace(/\*\*$/, '');
            return;
        }
        
        // Format 2: 1., 2., etc.
        if (line.match(/^\d+\./)) {
            if (currentQuestion) {
                parsedQuestions.push({
                    question: currentQuestion.trim(),
                    answered: false
                });
            }
            questionNumber++;
            currentQuestion = line.replace(/^\d+\.\s*/, '');
            return;
        }
        
        // Format 3: Write a function that... (standalone)
        if (line.match(/^Write a function that/i) || line.match(/^Implement a function/i)) {
            if (currentQuestion) {
                parsedQuestions.push({
                    question: currentQuestion.trim(),
                    answered: false
                });
            }
            questionNumber++;
            currentQuestion = line;
            return;
        }
        
        // Continue building current question
        if (currentQuestion && line.trim()) {
            // Skip certain formatting lines
            if (!line.match(/^(Input:|Output:|Example:|Requirements:|Expected Complexity:|Tips:|Duration:|Focus:|Interview Type:)/)) {
                currentQuestion += '\n' + line;
            }
        }
    });
    
    // Add the last question
    if (currentQuestion) {
        parsedQuestions.push({
            question: currentQuestion.trim(),
            answered: false
        });
    }
    
    console.log(`📋 Parsed ${parsedQuestions.length} questions:`, parsedQuestions.map(q => q.question.substring(0, 80) + '...'));
    
    // Improved fallback with actual coding questions
    if (parsedQuestions.length === 0) {
        console.log('⚠️ No questions parsed, using emergency coding challenges');
        return [
            {
                question: "Write a function that finds two numbers in an array that add up to a target sum. Return the indices of these two numbers.\n\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] (indices of 2 and 7)",
                answered: false
            },
            {
                question: "Write a function that determines if a string of parentheses is properly balanced.\n\nInput: s = '()[]{}'\nOutput: true",
                answered: false
            },
            {
                question: "Write a function that reverses a singly linked list iteratively.\n\nInput: 1->2->3->4->5\nOutput: 5->4->3->2->1",
                answered: false
            }
        ];
    }
    
    return parsedQuestions;
}

function formatQuestionContent(questionText) {
    if (!questionText) return '';
    
    // Replace newlines with line breaks for HTML display
    let formatted = questionText.replace(/\n/g, '<br>');
    
    // Highlight code snippets (simple approach)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Highlight input/output examples
    formatted = formatted.replace(/Input:\s*(.+)/gi, '<strong>Input:</strong> <code>$1</code>');
    formatted = formatted.replace(/Output:\s*(.+)/gi, '<strong>Output:</strong> <code>$1</code>');
    
    // Highlight requirements
    formatted = formatted.replace(/Requirements?:\s*/gi, '<strong>Requirements:</strong><br>');
    
    return formatted;
}

function getEmergencyQuestions() {
    return [
        {
            question: "Write a function that finds two numbers in an array that add up to a target sum. Return the indices of these two numbers.\n\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] (indices of 2 and 7)",
            answered: false
        },
        {
            question: "Write a function that determines if a string of parentheses is properly balanced.\n\nInput: s = '()[]{}'\nOutput: true",
            answered: false
        },
        {
            question: "Write a function that reverses a singly linked list iteratively.\n\nInput: 1->2->3->4->5\nOutput: 5->4->3->2->1",
            answered: false
        },
        {
            question: "Implement a function to find the maximum depth of a binary tree.\n\nInput: Binary tree with root [3,9,20,null,null,15,7]\nOutput: 3",
            answered: false
        },
        {
            question: "Write a function to merge two sorted arrays into one sorted array.\n\nInput: arr1 = [1,3,5], arr2 = [2,4,6]\nOutput: [1,2,3,4,5,6]",
            answered: false
        }
    ];
}

module.exports = {
    parseQuestionsFromText,
    formatQuestionContent,
    getEmergencyQuestions
};