const { ipcMain } = require('electron');
const { makeAIRequest } = require('./aiProviders');
const { generateFallbackQuestions, generateFallbackEvaluation } = require('./fallbackGenerators');

function setupQuestionGenerationHandler() {
    ipcMain.handle('generate-questions', async (event, data) => {
        console.log('Generating questions with data:', data);
        
        try {
            const { 
                jobDescription, 
                cvContent, 
                selectedLanguages, 
                difficulty, 
                questionCount,
                experienceLevel 
            } = data;

            // Enhanced prompt for better question generation
            const systemPrompt = `You are an expert technical interviewer. Generate exactly ${questionCount} interview questions for a ${experienceLevel} level ${difficulty} technical interview.

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

            console.log('Making AI request for question generation...');
            
            const response = await makeAIRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate ${questionCount} interview questions for this profile.` }
            ]);

            console.log('AI Response received:', response.substring(0, 200) + '...');

            // Try to parse JSON response
            let parsedResponse;
            try {
                // Clean up the response - remove any markdown formatting
                const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                parsedResponse = JSON.parse(cleanResponse);
                
                // Validate the structure
                if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
                    throw new Error('Invalid response structure - missing questions array');
                }
                
                // Ensure we have the right number of questions
                if (parsedResponse.questions.length !== questionCount) {
                    console.warn(`Expected ${questionCount} questions, got ${parsedResponse.questions.length}`);
                }
                
                // Validate each question has required fields
                parsedResponse.questions = parsedResponse.questions.map((q, index) => ({
                    id: q.id || index + 1,
                    question: q.question || `Question ${index + 1}`,
                    type: q.type || 'technical',
                    difficulty: q.difficulty || experienceLevel || 'intermediate',
                    topic: q.topic || 'general',
                    expectedAnswerPoints: q.expectedAnswerPoints || []
                }));
                
                console.log(`Successfully generated ${parsedResponse.questions.length} questions`);
                
                return {
                    success: true,
                    questions: parsedResponse.questions,
                    metadata: {
                        ...parsedResponse.metadata,
                        generatedBy: 'ai',
                        timestamp: new Date().toISOString()
                    }
                };
                
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', parseError);
                console.log('Raw response:', response);
                
                // Try to extract questions using fallback parsing
                const fallbackQuestions = extractQuestionsFromText(response, questionCount);
                if (fallbackQuestions.length > 0) {
                    return {
                        success: true,
                        questions: fallbackQuestions,
                        metadata: {
                            generatedBy: 'ai-fallback-parsed',
                            timestamp: new Date().toISOString(),
                            originalResponseLength: response.length
                        }
                    };
                }
                
                throw parseError;
            }

        } catch (error) {
            console.error('Question generation failed:', error);
            
            // Fall back to static questions
            console.log('Falling back to static question generation...');
            const fallbackResult = generateFallbackQuestions(data);
            
            return {
                success: true,
                questions: fallbackResult.questions,
                metadata: {
                    ...fallbackResult.metadata,
                    aiError: error.message,
                    fallbackReason: 'AI generation failed'
                }
            };
        }
    });
}

function setupEvaluationHandler() {
    ipcMain.handle('evaluate-performance', async (event, data) => {
        console.log('Evaluating performance with data:', data);
        
        try {
            const { answers, questions, duration, interviewData } = data;
            
            if (!answers || !questions) {
                throw new Error('Missing answers or questions data');
            }

            // Prepare evaluation prompt
            const systemPrompt = `You are an expert technical interviewer evaluating a candidate's performance. 

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

            console.log('Making AI request for performance evaluation...');
            
            const response = await makeAIRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Please evaluate this interview performance.' }
            ]);

            console.log('AI Evaluation response received:', response.substring(0, 200) + '...');

            // Try to parse JSON response
            try {
                const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsedResponse = JSON.parse(cleanResponse);
                
                // Validate and sanitize scores
                const scores = {
                    overall: Math.max(0, Math.min(100, parsedResponse.scores?.overall || 70)),
                    technical: Math.max(0, Math.min(100, parsedResponse.scores?.technical || 70)),
                    communication: Math.max(0, Math.min(100, parsedResponse.scores?.communication || 70)),
                    problemSolving: Math.max(0, Math.min(100, parsedResponse.scores?.problemSolving || 70))
                };
                
                return {
                    success: true,
                    scores: scores,
                    feedback: {
                        overall: parsedResponse.feedback?.overall || 'Good interview performance overall.',
                        technical: parsedResponse.feedback?.technical || 'Technical skills demonstrated adequately.',
                        communication: parsedResponse.feedback?.communication || 'Communication was clear and effective.',
                        problemSolving: parsedResponse.feedback?.problemSolving || 'Problem-solving approach was logical.'
                    },
                    recommendations: parsedResponse.recommendations || ['Continue developing technical skills', 'Practice interview scenarios'],
                    strengths: parsedResponse.strengths || ['Good foundational knowledge'],
                    improvements: parsedResponse.improvements || ['More specific examples could be helpful'],
                    metadata: {
                        evaluatedBy: 'ai',
                        timestamp: new Date().toISOString(),
                        duration: Math.round(duration / 60000),
                        questionsAnswered: Object.keys(answers).length
                    }
                };
                
            } catch (parseError) {
                console.error('Failed to parse AI evaluation response:', parseError);
                throw parseError;
            }

        } catch (error) {
            console.error('Performance evaluation failed:', error);
            
            // Fall back to static evaluation
            console.log('Falling back to static evaluation...');
            const fallbackResult = generateFallbackEvaluation(data);
            
            return {
                success: true,
                ...fallbackResult,
                metadata: {
                    ...fallbackResult.metadata,
                    aiError: error.message,
                    fallbackReason: 'AI evaluation failed'
                }
            };
        }
    });
}

// Helper function to extract questions from unstructured text
function extractQuestionsFromText(text, targetCount) {
    const questions = [];
    const lines = text.split('\n');
    let currentId = 1;
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && (
            trimmed.match(/^\d+\./) || 
            trimmed.match(/^Q\d+:/) || 
            trimmed.match(/^Question \d+:/) ||
            trimmed.includes('?')
        )) {
            // Extract question text
            let questionText = trimmed.replace(/^\d+\./, '').replace(/^Q\d+:/, '').replace(/^Question \d+:/, '').trim();
            
            if (questionText.length > 10) { // Minimum question length
                questions.push({
                    id: currentId++,
                    question: questionText,
                    type: 'technical',
                    difficulty: 'intermediate',
                    topic: 'general'
                });
                
                if (questions.length >= targetCount) {
                    break;
                }
            }
        }
    }
    
    return questions;
}

function setupAllInterviewHandlers() {
    setupQuestionGenerationHandler();
    setupEvaluationHandler();
}

module.exports = {
    setupAllInterviewHandlers,
    setupQuestionGenerationHandler,
    setupEvaluationHandler
};