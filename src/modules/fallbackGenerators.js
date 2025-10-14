function extractJobTitle(jobDescription) {
    if (!jobDescription || typeof jobDescription !== 'string') {
        return 'Software Developer';
    }
    
    const text = jobDescription.toLowerCase();
    const titlePatterns = [
        /job title:\s*([^\n]+)/i,
        /position:\s*([^\n]+)/i,
        /role:\s*([^\n]+)/i,
        /we are hiring a?\s*([^\n]+)/i,
        /looking for a?\s*([^\n]+)/i
    ];
    
    for (const pattern of titlePatterns) {
        const match = jobDescription.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return 'Software Developer';
}

function generateFallbackQuestions(data) {
    const questions = [];
    const jobTitle = extractJobTitle(data.jobDescription);
    const languages = data.selectedLanguages || [];
    const experience = data.experienceLevel || 'intermediate';
    
    // Basic technical questions
    questions.push({
        id: 1,
        question: `Tell me about your experience with ${languages.length > 0 ? languages[0] : 'programming'}.`,
        type: 'technical',
        difficulty: experience,
        topic: languages.length > 0 ? languages[0] : 'general'
    });
    
    questions.push({
        id: 2,
        question: `Describe a challenging ${jobTitle.toLowerCase()} project you've worked on.`,
        type: 'behavioral',
        difficulty: experience,
        topic: 'experience'
    });
    
    if (languages.length > 0) {
        questions.push({
            id: 3,
            question: `What are the key features of ${languages[0]} that make it suitable for this role?`,
            type: 'technical',
            difficulty: experience,
            topic: languages[0]
        });
    }
    
    questions.push({
        id: 4,
        question: `How do you approach debugging when your code isn't working as expected?`,
        type: 'technical',
        difficulty: experience,
        topic: 'problem-solving'
    });
    
    questions.push({
        id: 5,
        question: `Tell me about a time when you had to learn a new technology quickly.`,
        type: 'behavioral',
        difficulty: experience,
        topic: 'adaptability'
    });
    
    // Add more specific questions based on languages
    if (languages.includes('JavaScript')) {
        questions.push({
            id: 6,
            question: `Explain the difference between let, const, and var in JavaScript.`,
            type: 'technical',
            difficulty: experience,
            topic: 'JavaScript'
        });
    }
    
    if (languages.includes('Python')) {
        questions.push({
            id: 6,
            question: `What are Python decorators and how would you use them?`,
            type: 'technical',
            difficulty: experience,
            topic: 'Python'
        });
    }
    
    if (languages.includes('Java')) {
        questions.push({
            id: 6,
            question: `Explain the concept of inheritance in Java with an example.`,
            type: 'technical',
            difficulty: experience,
            topic: 'Java'
        });
    }
    
    if (languages.includes('React')) {
        questions.push({
            id: 7,
            question: `What is the virtual DOM in React and why is it useful?`,
            type: 'technical',
            difficulty: experience,
            topic: 'React'
        });
    }
    
    // System design question for senior levels
    if (experience === 'senior') {
        questions.push({
            id: 8,
            question: `Design a system that can handle user authentication for a web application with millions of users.`,
            type: 'system-design',
            difficulty: 'senior',
            topic: 'architecture'
        });
    }
    
    // Final behavioral question
    questions.push({
        id: questions.length + 1,
        question: `Do you have any questions about our team, the role, or the company?`,
        type: 'final',
        difficulty: 'any',
        topic: 'closing'
    });
    
    return {
        questions: questions.slice(0, Math.min(questions.length, 8)), // Limit to 8 questions
        metadata: {
            generatedBy: 'fallback',
            timestamp: new Date().toISOString(),
            jobTitle: jobTitle,
            languages: languages,
            experienceLevel: experience,
            totalQuestions: questions.length
        }
    };
}

function generateFallbackEvaluation(data) {
    const { answers, questions, duration, totalQuestions } = data;
    
    // Basic metrics
    const answeredQuestions = answers ? Object.keys(answers).length : 0;
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const averageAnswerLength = answers ? 
        Object.values(answers).reduce((sum, answer) => sum + (answer?.length || 0), 0) / answeredQuestions : 0;
    
    // Calculate scores based on available data
    let technicalScore = 65; // Default baseline
    let communicationScore = 70;
    let problemSolvingScore = 60;
    
    // Adjust based on completion rate
    if (completionRate > 80) {
        technicalScore += 10;
        communicationScore += 10;
        problemSolvingScore += 15;
    } else if (completionRate < 50) {
        technicalScore -= 15;
        communicationScore -= 10;
        problemSolvingScore -= 20;
    }
    
    // Adjust based on answer length (indicating depth of responses)
    if (averageAnswerLength > 200) {
        communicationScore += 10;
        technicalScore += 5;
    } else if (averageAnswerLength < 50) {
        communicationScore -= 10;
        technicalScore -= 5;
    }
    
    // Adjust based on interview duration vs expected time
    const expectedDuration = totalQuestions * 5 * 60000; // 5 minutes per question in ms
    const timeRatio = duration / expectedDuration;
    
    if (timeRatio > 1.5) {
        // Took too long - might indicate struggle
        problemSolvingScore -= 10;
    } else if (timeRatio < 0.5) {
        // Too fast - might indicate shallow answers
        technicalScore -= 5;
        communicationScore -= 5;
    }
    
    // Ensure scores are within valid range
    technicalScore = Math.max(0, Math.min(100, technicalScore));
    communicationScore = Math.max(0, Math.min(100, communicationScore));
    problemSolvingScore = Math.max(0, Math.min(100, problemSolvingScore));
    
    const overallScore = Math.round((technicalScore + communicationScore + problemSolvingScore) / 3);
    
    // Generate feedback based on scores
    let overallFeedback = "Thank you for completing the interview. ";
    
    if (overallScore >= 80) {
        overallFeedback += "You demonstrated strong technical knowledge and communication skills. Your responses showed good depth and understanding of the topics discussed.";
    } else if (overallScore >= 65) {
        overallFeedback += "You showed solid technical foundation with room for improvement in some areas. Consider providing more detailed examples and explanations in future interviews.";
    } else if (overallScore >= 50) {
        overallFeedback += "You have basic understanding of the concepts but would benefit from deeper technical knowledge and more practice with interview scenarios.";
    } else {
        overallFeedback += "There are several areas that need improvement. Consider studying the fundamental concepts more thoroughly and practicing technical interviews.";
    }
    
    // Generate specific feedback for each category
    const technicalFeedback = technicalScore >= 70 ? 
        "Strong technical knowledge demonstrated" : 
        "Technical skills need improvement - consider studying core concepts more deeply";
        
    const communicationFeedback = communicationScore >= 70 ? 
        "Good communication and explanation of ideas" : 
        "Work on providing clearer, more structured responses with specific examples";
        
    const problemSolvingFeedback = problemSolvingScore >= 70 ? 
        "Effective problem-solving approach" : 
        "Practice breaking down problems systematically and explaining your thought process";
    
    // Recommendations
    const recommendations = [];
    
    if (technicalScore < 70) {
        recommendations.push("Review fundamental concepts in your primary programming languages");
        recommendations.push("Practice coding problems on platforms like LeetCode or HackerRank");
    }
    
    if (communicationScore < 70) {
        recommendations.push("Practice explaining technical concepts to non-technical audiences");
        recommendations.push("Work on structuring your responses with clear beginning, middle, and end");
    }
    
    if (problemSolvingScore < 70) {
        recommendations.push("Practice whiteboard coding and thinking out loud");
        recommendations.push("Study system design patterns and common algorithms");
    }
    
    if (completionRate < 100) {
        recommendations.push("Practice time management during interviews");
        recommendations.push("Prepare concise but complete answers for common questions");
    }
    
    return {
        scores: {
            overall: overallScore,
            technical: technicalScore,
            communication: communicationScore,
            problemSolving: problemSolvingScore
        },
        feedback: {
            overall: overallFeedback,
            technical: technicalFeedback,
            communication: communicationFeedback,
            problemSolving: problemSolvingFeedback
        },
        recommendations: recommendations,
        metrics: {
            questionsAnswered: answeredQuestions,
            totalQuestions: totalQuestions,
            completionRate: Math.round(completionRate),
            averageAnswerLength: Math.round(averageAnswerLength),
            interviewDuration: Math.round(duration / 60000), // in minutes
            timePerQuestion: Math.round(duration / (answeredQuestions || 1) / 60000) // in minutes
        },
        metadata: {
            evaluatedBy: 'fallback',
            timestamp: new Date().toISOString(),
            version: '1.0'
        }
    };
}

module.exports = {
    extractJobTitle,
    generateFallbackQuestions,
    generateFallbackEvaluation
};