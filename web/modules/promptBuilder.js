// Interview prompt builders and question/evaluation parsing

function buildQuestionPrompt(data) {
    const { jobDescription, cvContent, selectedLanguages, difficulty, questionCount, experienceLevel } = data;
    
    return `You are an expert technical interviewer. Generate exactly ${questionCount} interview questions for a ${experienceLevel} level ${difficulty} technical interview.

Context:
- Job Description: ${jobDescription || 'Software Developer position'}
- Candidate's CV: ${cvContent || 'Not provided'}
- Required Technologies: ${selectedLanguages?.join(', ') || 'General programming'}
- Experience Level: ${experienceLevel || 'intermediate'}
- Difficulty: ${difficulty || 'medium'}

Generate exactly ${questionCount} questions that:
1. Test relevant technical skills for the mentioned technologies
2. Are appropriate for ${experienceLevel} level candidates  
3. Include a mix of technical concepts, coding scenarios, and problem-solving
4. Are specific to the job requirements when possible
5. Progressively increase in complexity

Format your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Your question here",
      "type": "technical|behavioral|coding|system-design",
      "difficulty": "junior|intermediate|senior",
      "topic": "relevant technology or concept",
      "expectedAnswerPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ],
  "metadata": {
    "generatedFor": "${experienceLevel} ${difficulty} interview",
    "technologies": [${selectedLanguages?.map(lang => `"${lang}"`).join(', ') || ''}],
    "totalQuestions": ${questionCount}
  }
}

Ensure the JSON is valid and complete.`;
}

function buildEvaluationPrompt(data) {
    const { answers, questions, duration, interviewData } = data;
    
    return `You are an expert technical interviewer evaluating a candidate's performance. 

Analyze the candidate's responses and provide a comprehensive evaluation.

Interview Context:
- Position: ${interviewData?.jobDescription ? 'Based on provided job description' : 'Software Developer'}
- Experience Level: ${interviewData?.experienceLevel || 'intermediate'}
- Technologies: ${interviewData?.selectedLanguages?.join(', ') || 'General programming'}
- Duration: ${Math.round(duration / 60000)} minutes

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1} (${q.type || 'technical'}): ${q.question}
Candidate's Answer: ${answers[q.id] || 'No answer provided'}
`).join('\n')}

Provide your evaluation as a JSON object with this exact structure:
{
  "scores": {
    "overall": 85,
    "technical": 80,
    "communication": 90,
    "problemSolving": 75
  },
  "feedback": {
    "overall": "Comprehensive overall feedback...",
    "technical": "Technical skills feedback...",
    "communication": "Communication skills feedback...",
    "problemSolving": "Problem-solving feedback..."
  },
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "strengths": [
    "Key strength 1",
    "Key strength 2"
  ],
  "improvements": [
    "Area for improvement 1",
    "Area for improvement 2"
  ]
}

All scores should be between 0-100. Provide constructive, specific feedback.`;
}

function parseQuestionsFromResponse(response) {
    try {
        // Clean up the response - remove any markdown formatting
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        
        // Validate structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid response structure - missing questions array');
        }
        
        // Ensure each question has required fields
        const questions = parsed.questions.map((q, index) => ({
            id: q.id || index + 1,
            question: q.question || `Question ${index + 1}`,
            type: q.type || 'technical',
            difficulty: q.difficulty || 'intermediate',
            topic: q.topic || 'general',
            expectedAnswerPoints: q.expectedAnswerPoints || []
        }));
        
        return {
            success: true,
            questions: questions,
            metadata: {
                ...parsed.metadata,
                generatedBy: 'ai',
                timestamp: new Date().toISOString()
            }
        };
        
    } catch (error) {
        console.error('Failed to parse questions from response:', error);
        
        // Try fallback parsing
        const fallbackQuestions = extractQuestionsFromText(response);
        if (fallbackQuestions.length > 0) {
            return {
                success: true,
                questions: fallbackQuestions,
                metadata: {
                    generatedBy: 'ai-fallback-parsed',
                    timestamp: new Date().toISOString(),
                    parseError: error.message
                }
            };
        }
        
        return {
            success: false,
            error: error.message,
            questions: [],
            rawResponse: response.substring(0, 500)
        };
    }
}

function parseEvaluationFromResponse(response) {
    try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        
        // Validate and sanitize scores
        const scores = {
            overall: Math.max(0, Math.min(100, parsed.scores?.overall || 70)),
            technical: Math.max(0, Math.min(100, parsed.scores?.technical || 70)),
            communication: Math.max(0, Math.min(100, parsed.scores?.communication || 70)),
            problemSolving: Math.max(0, Math.min(100, parsed.scores?.problemSolving || 70))
        };
        
        return {
            success: true,
            scores: scores,
            feedback: {
                overall: parsed.feedback?.overall || 'Good interview performance overall.',
                technical: parsed.feedback?.technical || 'Technical skills demonstrated adequately.',
                communication: parsed.feedback?.communication || 'Communication was clear and effective.',
                problemSolving: parsed.feedback?.problemSolving || 'Problem-solving approach was logical.'
            },
            recommendations: parsed.recommendations || ['Continue developing technical skills', 'Practice interview scenarios'],
            strengths: parsed.strengths || ['Good foundational knowledge'],
            improvements: parsed.improvements || ['More specific examples could be helpful'],
            metadata: {
                evaluatedBy: 'ai',
                timestamp: new Date().toISOString()
            }
        };
        
    } catch (error) {
        console.error('Failed to parse evaluation from response:', error);
        return {
            success: false,
            error: error.message,
            rawResponse: response.substring(0, 500)
        };
    }
}

// Helper function to extract questions from unstructured text
function extractQuestionsFromText(text, targetCount = 5) {
    const questions = [];
    const lines = text.split('\n');
    let currentId = 1;
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && (
            trimmed.match(/^\d+\./) || 
            trimmed.match(/^Q\d+:/) || 
            trimmed.match(/^Question \d+:/) ||
            (trimmed.includes('?') && trimmed.length > 20)
        )) {
            // Extract question text
            let questionText = trimmed
                .replace(/^\d+\./, '')
                .replace(/^Q\d+:/, '')
                .replace(/^Question \d+:/, '')
                .trim();
            
            if (questionText.length > 10) { // Minimum question length
                questions.push({
                    id: currentId++,
                    question: questionText,
                    type: 'technical',
                    difficulty: 'intermediate',
                    topic: 'general',
                    expectedAnswerPoints: []
                });
                
                if (questions.length >= targetCount) {
                    break;
                }
            }
        }
    }
    
    return questions;
}

module.exports = {
    buildQuestionPrompt,
    buildEvaluationPrompt,
    parseQuestionsFromResponse,
    parseEvaluationFromResponse,
    extractQuestionsFromText
};