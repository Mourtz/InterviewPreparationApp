const { ipcRenderer } = require('electron');

// Global variables
let interviewData = {};
let currentQuestionIndex = 0;
let questions = [];
let answers = [];
let startTime = Date.now();
let timer = null;
let timeRemaining = 0;
let isPaused = false;
let answerEditor = null;
let notesEditor = null;
let editorMode = 'text'; // 'text' or 'code'

// Enhanced fallback protection function
function applyFallbackProtection(element) {
    if (!element) return;
    
    console.log('🛡️ Applying fallback ultra-aggressive protection');
    
    // Apply all available protection functions
    if (typeof disableTextSelection === 'function') {
        disableTextSelection([element]);
    }
    if (typeof disableContextMenu === 'function') {
        disableContextMenu([element]);
    }
    if (typeof disableCopyShortcuts === 'function') {
        disableCopyShortcuts([element]);
    }
    
    element.classList.add('copy-protected', 'ultra-protected');
    
    // Aggressive CSS protection
    element.style.cssText += `
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
        pointer-events: auto !important;
        cursor: default !important;
    `;
    
    // HTML attributes for legacy browsers
    element.setAttribute('unselectable', 'on');
    element.setAttribute('onselectstart', 'return false;');
    element.setAttribute('ondragstart', 'return false;');
    element.setAttribute('oncontextmenu', 'return false;');
    
    // Event blocking with aggressive preventDefault
    const ultraBlockEvent = (e) => {
        console.log('🚫 Blocked', e.type, 'event on question content');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (typeof showCopyProtectionMessage === 'function') {
            showCopyProtectionMessage();
        }
        return false;
    };
    
    // Block all events that could lead to text selection or copying
    const eventsToBlock = [
        'copy', 'cut', 'selectstart', 'mousedown', 'mouseup', 'mousemove',
        'dragstart', 'drag', 'dragend', 'click', 'dblclick', 'contextmenu',
        'keydown', 'keyup', 'keypress', 'focus', 'blur'
    ];
    
    eventsToBlock.forEach(eventType => {
        element.addEventListener(eventType, ultraBlockEvent, true);
    });
    
    // Protect all child elements recursively
    const protectChildren = (parent) => {
        Array.from(parent.children).forEach(child => {
            child.classList.add('copy-protected', 'ultra-protected');
            child.style.cssText += `
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-user-drag: none !important;
            `;
            
            eventsToBlock.forEach(eventType => {
                child.addEventListener(eventType, ultraBlockEvent, true);
            });
            
            // Recursively protect grandchildren
            if (child.children.length > 0) {
                protectChildren(child);
            }
        });
    };
    
    protectChildren(element);
    
    console.log('🛡️ Fallback ultra-aggressive protection applied');
}

// Force production mode function for testing
function forceProductionModeForTesting() {
    console.log('🔧 FORCING PRODUCTION MODE FOR TESTING IN INTERVIEW WINDOW');
    window._forceProductionMode = true;
    
    // Re-enable copy protection
    if (typeof enableCopyProtection === 'function') {
        enableCopyProtection();
    }
    
    // Re-protect current question if displayed
    const questionContent = document.getElementById('question-content');
    if (questionContent) {
        if (typeof protectQuestionContent === 'function') {
            protectQuestionContent(questionContent);
        } else {
            applyFallbackProtection(questionContent);
        }
        console.log('🔧 Question content re-protected in forced production mode');
    }
}

// Initialize interview window
document.addEventListener('DOMContentLoaded', async () => {
    // Enable copy protection for release builds
    if (typeof enableCopyProtection === 'function') {
        enableCopyProtection();
    }
    
    await loadInterviewData();
    initializeEditors();
    setupEventListeners();
    startTimer();
    loadQuestion(0);
});

async function loadInterviewData() {
    try {
        interviewData = await ipcRenderer.invoke('get-interview-data');
        questions = parseQuestions(interviewData.questions);
        timeRemaining = interviewData.duration * 60; // Convert to seconds
        
        // Update UI with interview details
        document.getElementById('total-questions').textContent = questions.length;
        
        // Display programming language and interview type
        const languageMap = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'python': 'Python',
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
            'go': 'Go',
            'rust': 'Rust',
            'php': 'PHP',
            'ruby': 'Ruby',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'scala': 'Scala',
            'sql': 'SQL'
        };
        
        const typeMap = {
            'coding': 'Coding Challenges',
            'theoretical': 'Theoretical Questions',
            'mixed': 'Mixed Interview',
            'system-design': 'System Design'
        };
        
        const languageName = languageMap[interviewData.programmingLanguage] || 'Python';
        const typeName = typeMap[interviewData.interviewType] || 'Coding Challenges';
        
        document.getElementById('interview-language').textContent = `Language: ${languageName}`;
        document.getElementById('interview-type').textContent = `Type: ${typeName}`;
        
        updateTimer();
        generateQuestionsOverview();
    } catch (error) {
        console.error('Failed to load interview data:', error);
    }
}

function parseQuestions(questionsText) {
    // Parse questions from the generated text
    const lines = questionsText.split('\n').filter(line => line.trim());
    const parsedQuestions = [];
    
    console.log('🔍 Parsing questions from text:', questionsText.substring(0, 300) + '...');
    
    let currentQuestion = '';
    let questionNumber = 0;
    
    lines.forEach(line => {
        // Look for different question formats
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

function initializeEditors() {
    // Determine the appropriate CodeMirror mode based on programming language
    const languageModes = {
        'javascript': 'javascript',
        'typescript': 'javascript', // TypeScript uses javascript mode
        'python': 'python',
        'java': 'text/x-java',
        'csharp': 'text/x-csharp',
        'cpp': 'text/x-c++src',
        'go': 'go',
        'rust': 'rust',
        'php': 'php',
        'ruby': 'ruby',
        'swift': 'swift',
        'kotlin': 'text/x-kotlin',
        'scala': 'text/x-scala',
        'sql': 'sql'
    };
    
    const selectedLanguage = interviewData.programmingLanguage || 'python';
    const codeMode = languageModes[selectedLanguage] || 'python';
    const isCodingInterview = interviewData.interviewType === 'coding' || interviewData.interviewType === 'mixed';
    
    // Answer editor - start in code mode for coding interviews
    const initialMode = isCodingInterview ? codeMode : 'markdown';
    editorMode = isCodingInterview ? 'code' : 'text';
    
    answerEditor = CodeMirror(document.getElementById('answer-editor'), {
        mode: initialMode,
        theme: 'material-darker',
        lineNumbers: true,
        lineWrapping: true,
        placeholder: isCodingInterview 
            ? `Write your ${languageModes[selectedLanguage] || 'code'} solution here...\n\nTips:\n- Think about edge cases\n- Consider time and space complexity\n- Write clean, readable code\n- Test your solution mentally`
            : 'Type your answer here...\n\nTips:\n- Explain your thought process\n- Provide specific examples\n- Break down complex problems into steps',
        value: '',
        autofocus: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: {
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection("    ", "end");
                }
            }
        }
    });
    
    // Update toggle button text
    const toggleButton = document.getElementById('toggle-mode');
    toggleButton.textContent = isCodingInterview ? '📝 Switch to Text Mode' : '💻 Switch to Code Mode';
    
    // Notes editor
    notesEditor = CodeMirror(document.getElementById('notes-editor'), {
        mode: 'markdown',
        theme: 'material-darker',
        lineNumbers: false,
        lineWrapping: true,
        placeholder: 'Quick notes and reminders...',
        value: ''
    });
    
    // Apply copy protection to editors in release builds
    if (typeof protectEditors === 'function') {
        protectEditors(answerEditor, notesEditor);
    }
}

function setupEventListeners() {
    // Question navigation
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('save-answer').addEventListener('click', saveCurrentAnswer);
    
    // Add previous question button if it exists
    const prevButton = document.getElementById('prev-question');
    if (prevButton) {
        prevButton.addEventListener('click', previousQuestion);
    }
    
    // Editor mode toggle
    document.getElementById('toggle-mode').addEventListener('click', toggleEditorMode);
    
    // Interview controls
    document.getElementById('pause-interview').addEventListener('click', togglePause);
    document.getElementById('end-interview').addEventListener('click', showEndModal);
    
    // Text-to-speech
    document.getElementById('speak-question').addEventListener('click', speakQuestion);
    
    // End modal
    document.getElementById('cancel-end').addEventListener('click', closeEndModal);
    document.getElementById('confirm-end').addEventListener('click', endInterview);
    
    // Results modal
    document.getElementById('export-results').addEventListener('click', exportResults);
    document.getElementById('new-interview').addEventListener('click', newInterview);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                saveCurrentAnswer();
                break;
            case 'Enter':
                event.preventDefault();
                nextQuestion();
                break;
            case 'p':
                event.preventDefault();
                togglePause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                previousQuestion();
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextQuestion();
                break;
        }
    } else if (event.altKey) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                previousQuestion();
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextQuestion();
                break;
        }
    }
}

function startTimer() {
    timer = setInterval(() => {
        if (!isPaused && timeRemaining > 0) {
            timeRemaining--;
            updateTimer();
            
            if (timeRemaining === 0) {
                endInterview();
            }
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timerDisplay = document.getElementById('timer');
    
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color based on remaining time
    if (timeRemaining <= 300) { // 5 minutes
        timerDisplay.style.color = '#f56565';
    } else if (timeRemaining <= 600) { // 10 minutes
        timerDisplay.style.color = '#ed8936';
    } else {
        timerDisplay.style.color = '#f6e05e';
    }
}

function loadQuestion(index) {
    if (index >= questions.length) {
        endInterview();
        return;
    }
    
    currentQuestionIndex = index;
    
    // Track the highest question reached to prevent spoilers
    updateHighestReachedQuestion(index);
    
    const question = questions[index];
    
    // Update question display
    document.getElementById('question-content').innerHTML = formatQuestionContent(question.question);
    document.getElementById('current-question').textContent = index + 1;
    
    // Apply ULTRA-AGGRESSIVE copy protection to question content in release builds
    // Use setTimeout to ensure DOM is fully updated before applying protection
    setTimeout(() => {
        if (typeof isProductionBuild === 'function' && isProductionBuild()) {
            const questionContent = document.getElementById('question-content');
            if (questionContent) {
                // Use the ultra-aggressive protection function
                if (typeof protectQuestionContent === 'function') {
                    protectQuestionContent(questionContent);
                    console.log('🛡️ Applied ULTRA-AGGRESSIVE protection to question content');
                } else {
                    // Fallback to standard protection with extra measures
                    applyFallbackProtection(questionContent);
                    console.log('🛡️ Applied fallback ultra-aggressive protection to question content');
                }
                
                // Double-check protection by re-applying after a short delay
                setTimeout(() => {
                    if (typeof protectQuestionContent === 'function') {
                        protectQuestionContent(questionContent);
                        console.log('🛡️ Re-applied protection to ensure coverage');
                    }
                }, 100);
            }
        }
    }, 10);
    
    // Update progress
    const progressPercentage = ((index + 1) / questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
    
    // Load existing answer if any
    if (answers[index]) {
        answerEditor.setValue(answers[index]);
    } else {
        answerEditor.setValue('');
    }
    
    // Update questions overview
    updateQuestionsOverview();
    
    // Update navigation button states
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    
    // Update previous button
    if (prevButton) {
        if (currentQuestionIndex > 0) {
            prevButton.disabled = false;
            prevButton.textContent = '⬅️ Previous Question';
            prevButton.title = 'Go to previous question';
        } else {
            prevButton.disabled = true;
            prevButton.textContent = '⬅️ Previous Question';
            prevButton.title = 'No previous question';
        }
    }
    
    // Update next button
    if (nextButton) {
        if (currentQuestionIndex < questions.length - 1) {
            nextButton.textContent = '➡️ Next Question';
            nextButton.title = 'Proceed to next question';
        } else {
            nextButton.textContent = '🏁 Finish Interview';
            nextButton.title = 'Complete the interview';
        }
    }
}

function formatQuestionContent(question) {
    // Add some formatting to make questions more readable
    return `<div class="question-text">${question}</div>`;
}

// Fallback protection function for when main copy protection isn't available
function applyFallbackProtection(questionContent) {
    // Apply all available protection methods
    if (typeof disableTextSelection === 'function') disableTextSelection([questionContent]);
    if (typeof disableContextMenu === 'function') disableContextMenu([questionContent]);
    if (typeof disableCopyShortcuts === 'function') disableCopyShortcuts([questionContent]);
    
    questionContent.classList.add('copy-protected', 'ultra-protected');
    
    // Additional ultra-aggressive measures
    questionContent.setAttribute('unselectable', 'on');
    questionContent.setAttribute('onselectstart', 'return false;');
    questionContent.setAttribute('onmousedown', 'return false;');
    questionContent.setAttribute('ondragstart', 'return false;');
    questionContent.setAttribute('oncontextmenu', 'return false;');
    
    questionContent.style.cssText += `
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
        pointer-events: none !important;
        cursor: default !important;
    `;
    
    // Override event handlers
    questionContent.onclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    questionContent.ondblclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    questionContent.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    questionContent.onselectstart = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    questionContent.ondragstart = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    questionContent.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    
    // Protect all child elements
    const questionElements = questionContent.querySelectorAll('*');
    questionElements.forEach(el => {
        if (typeof disableTextSelection === 'function') disableTextSelection([el]);
        if (typeof disableContextMenu === 'function') disableContextMenu([el]);
        el.classList.add('copy-protected', 'ultra-protected');
        el.setAttribute('unselectable', 'on');
        el.setAttribute('onselectstart', 'return false;');
        el.setAttribute('onmousedown', 'return false;');
        el.setAttribute('ondragstart', 'return false;');
        el.setAttribute('oncontextmenu', 'return false;');
        
        el.style.cssText += `
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-drag: none !important;
            pointer-events: none !important;
            cursor: default !important;
        `;
        
        el.onclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        el.ondblclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        el.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        el.onselectstart = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        el.ondragstart = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    });
}

function generateQuestionsOverview() {
    const overview = document.getElementById('questions-overview');
    overview.innerHTML = '';
    
    questions.forEach((question, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        
        // Show only question number and status, not the question content
        const statusIcon = answers[index] && answers[index].trim() ? '✅' : '⭕';
        const statusText = answers[index] && answers[index].trim() ? 'Answered' : 'Not Answered';
        
        item.innerHTML = `
            <div class="question-number">Q${index + 1}</div>
            <div class="question-status">
                <span class="status-icon">${statusIcon}</span>
                <span class="status-text">${statusText}</span>
            </div>
        `;
        
        // Only allow navigation to previous questions and current question
        // This prevents spoilers and enforces sequential progression
        if (index <= Math.max(currentQuestionIndex, getHighestReachedQuestion())) {
            item.classList.add('accessible');
            item.addEventListener('click', () => {
                if (index !== currentQuestionIndex) {
                    saveCurrentAnswer();
                    loadQuestion(index);
                }
            });
        } else {
            item.classList.add('locked');
            item.title = 'Complete current question to unlock';
        }
        
        overview.appendChild(item);
    });
}

// Helper function to track the highest question number reached
function getHighestReachedQuestion() {
    // Store in a simple variable that persists during the session
    if (!window.highestReachedQuestion) {
        window.highestReachedQuestion = 0;
    }
    return window.highestReachedQuestion;
}

function updateHighestReachedQuestion(questionIndex) {
    if (!window.highestReachedQuestion) {
        window.highestReachedQuestion = 0;
    }
    window.highestReachedQuestion = Math.max(window.highestReachedQuestion, questionIndex);
}

function updateQuestionsOverview() {
    const items = document.querySelectorAll('.question-item');
    const highestReached = getHighestReachedQuestion();
    
    items.forEach((item, index) => {
        item.classList.remove('current', 'answered', 'accessible', 'locked');
        
        // Mark current question
        if (index === currentQuestionIndex) {
            item.classList.add('current');
        }
        
        // Mark answered questions
        if (answers[index] && answers[index].trim()) {
            item.classList.add('answered');
            const statusIcon = item.querySelector('.status-icon');
            const statusText = item.querySelector('.status-text');
            if (statusIcon) statusIcon.textContent = '✅';
            if (statusText) statusText.textContent = 'Answered';
        } else {
            const statusIcon = item.querySelector('.status-icon');
            const statusText = item.querySelector('.status-text');
            if (statusIcon) statusIcon.textContent = '⭕';
            if (statusText) statusText.textContent = 'Not Answered';
        }
        
        // Update accessibility based on highest reached question
        if (index <= highestReached) {
            item.classList.add('accessible');
            item.title = index === currentQuestionIndex ? 'Current question' : 'Click to revisit';
            
            // Re-add click listener for accessible questions
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            if (index !== currentQuestionIndex) {
                newItem.addEventListener('click', () => {
                    saveCurrentAnswer();
                    loadQuestion(index);
                });
            }
        } else {
            item.classList.add('locked');
            item.title = 'Complete current question to unlock';
        }
    });
}

function saveCurrentAnswer() {
    const answer = answerEditor.getValue();
    answers[currentQuestionIndex] = answer;
    
    if (answer.trim()) {
        questions[currentQuestionIndex].answered = true;
    }
    
    updateQuestionsOverview();
    
    // Show save confirmation
    showNotification('Answer saved', 'success');
}

function nextQuestion() {
    // Check if current answer is empty or too short before proceeding
    const currentAnswer = answerEditor.getValue().trim();
    
    // STRICT validation - check for meaningful answers
    const isAnswerMeaningful = validateAnswer(currentAnswer);
    
    if (!currentAnswer || currentAnswer.length === 0) {
        // Completely empty answer
        const shouldProceed = confirm(
            `🚨 CRITICAL WARNING: No Answer Provided!\n\n` +
            `You haven't written any code or answer for this question.\n\n` +
            `Proceeding with empty answers will result in:\n` +
            `• AUTOMATIC FAILURE of the interview\n` +
            `• Score of 0 points\n` +
            `• Very poor performance evaluation\n\n` +
            `Real technical interviews require attempting ALL questions!\n\n` +
            `❌ Click "Cancel" to write an actual answer\n` +
            `⚠️ Click "OK" only if you're certain you want to skip (NOT RECOMMENDED)`
        );
        
        if (!shouldProceed) {
            showNotification('💡 Please provide a meaningful answer before proceeding', 'warning');
            answerEditor.focus();
            return;
        } else {
            showNotification('� Empty answer recorded - this WILL result in interview failure', 'error');
        }
    } else if (currentAnswer.length < 25 || !isAnswerMeaningful) {
        // Very short or non-meaningful answer
        const shortAnswerWarning = currentAnswer.length < 25 
            ? `Your answer is only ${currentAnswer.length} characters long.`
            : 'Your answer appears to be a placeholder or minimal response.';
            
        const shouldProceed = confirm(
            `⚠️ INADEQUATE ANSWER WARNING!\n\n` +
            `${shortAnswerWarning}\n\n` +
            `For coding interviews, substantial code solutions are REQUIRED.\n\n` +
            `Current answer issues:\n` +
            `• Too short or lacks actual code implementation\n` +
            `• May contain only placeholders or brief text\n` +
            `• Insufficient for evaluation by real interviewers\n\n` +
            `This will likely result in:\n` +
            `• Very low scores (0-25 points)\n` +
            `• Interview failure\n` +
            `• Poor feedback\n\n` +
            `❌ Click "Cancel" to expand your answer with actual code\n` +
            `⚠️ Click "OK" to proceed anyway (will impact your score)`
        );
        
        if (!shouldProceed) {
            showNotification('💡 Consider adding a complete code solution with proper logic', 'info');
            answerEditor.focus();
            return;
        } else {
            showNotification('⚠️ Insufficient answer recorded - this will negatively impact your evaluation', 'error');
        }
    } else if (currentAnswer.length < 50) {
        // Somewhat short answer - lighter warning
        const shouldProceed = confirm(
            `💡 Short Answer Notice\n\n` +
            `Your answer is ${currentAnswer.length} characters. While not empty, coding interviews typically expect more detailed solutions.\n\n` +
            `Consider adding:\n` +
            `• Complete function implementation\n` +
            `• Comments explaining your approach\n` +
            `• Error handling or edge cases\n\n` +
            `Continue anyway?`
        );
        
        if (!shouldProceed) {
            showNotification('💡 Consider expanding your solution for better evaluation', 'info');
            answerEditor.focus();
            return;
        }
    }
    
    // Save current answer
    saveCurrentAnswer();
    
    if (currentQuestionIndex < questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    } else {
        endInterview();
    }
}

function previousQuestion() {
    // Save current answer before going back
    saveCurrentAnswer();
    
    // Check if we can go back
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
        showNotification('Moved to previous question', 'info');
    } else {
        showNotification('Already at the first question', 'warning');
    }
}

// Helper function to validate if an answer is meaningful
function validateAnswer(answer) {
    if (!answer || answer.trim().length < 15) {
        return false;
    }
    
    const trimmed = answer.trim().toLowerCase();
    
    // Check for placeholder text
    const placeholders = [
        'your code here', 'todo', 'implement', 'solution goes here', 
        'answer here', 'code here', 'write your', 'fill this',
        'placeholder', 'example', 'sample'
    ];
    
    // Check if answer is mostly placeholder
    const hasPlaceholders = placeholders.some(placeholder => 
        trimmed.includes(placeholder)
    );
    
    if (hasPlaceholders) {
        return false;
    }
    
    // Check for minimal responses
    const minimalResponses = [
        /^(yes|no|true|false|maybe)$/,
        /^(function|def|class|return|print)$/,
        /^(null|undefined|none|void)$/,
        /^(i don't know|don't know|idk|dk)$/,
        /^(solution|answer|code)$/
    ];
    
    if (minimalResponses.some(pattern => pattern.test(trimmed))) {
        return false;
    }
    
    // Check for actual code structure or substantial content
    const hasCodeStructure = /[{}()\[\];]/g.test(answer) && answer.length > 30;
    const hasMultipleLines = answer.split('\n').length > 1;
    const hasKeywords = /(if|for|while|return|def|function|class|var|let|const)/i.test(answer);
    
    // Must have either code structure OR multiple lines with keywords
    return hasCodeStructure || (hasMultipleLines && hasKeywords);
}

function toggleEditorMode() {
    const toggleBtn = document.getElementById('toggle-mode');
    const runBtn = document.getElementById('run-code');
    
    // Language mode mapping
    const languageModes = {
        'javascript': 'javascript',
        'typescript': 'javascript',
        'python': 'python',
        'java': 'text/x-java',
        'csharp': 'text/x-csharp',
        'cpp': 'text/x-c++src',
        'go': 'go',
        'rust': 'rust',
        'php': 'php',
        'ruby': 'ruby',
        'swift': 'swift',
        'kotlin': 'text/x-kotlin',
        'scala': 'text/x-scala',
        'sql': 'sql'
    };
    
    const selectedLanguage = interviewData.programmingLanguage || 'python';
    const codeMode = languageModes[selectedLanguage] || 'python';
    
    if (editorMode === 'text') {
        editorMode = 'code';
        answerEditor.setOption('mode', codeMode);
        toggleBtn.innerHTML = '📝 Switch to Text Mode';
        runBtn.classList.remove('hidden');
    } else {
        editorMode = 'text';
        answerEditor.setOption('mode', 'markdown');
        toggleBtn.innerHTML = '💻 Switch to Code Mode';
        runBtn.classList.add('hidden');
    }
}

// Simple code runner (for demonstration purposes)
function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-interview');
    
    if (isPaused) {
        pauseBtn.innerHTML = '▶️ Resume';
        pauseBtn.classList.add('btn-primary');
        showNotification('Interview paused', 'info');
    } else {
        pauseBtn.innerHTML = '⏸️ Pause';
        pauseBtn.classList.remove('btn-primary');
        showNotification('Interview resumed', 'info');
    }
}

function speakQuestion() {
    if ('speechSynthesis' in window) {
        const question = questions[currentQuestionIndex].question;
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
    } else {
        showNotification('Text-to-speech not supported in this browser', 'warning');
    }
}

function showEndModal() {
    const answeredCount = answers.filter(answer => answer && answer.trim()).length;
    const totalTime = interviewData.duration * 60 - timeRemaining;
    const timeUsed = `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`;
    
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('total-count').textContent = questions.length;
    document.getElementById('time-used').textContent = timeUsed;
    
    document.getElementById('end-modal').classList.add('show');
}

function closeEndModal() {
    document.getElementById('end-modal').classList.remove('show');
}

async function endInterview() {
    clearInterval(timer);
    saveCurrentAnswer();
    
    // STRICT validation for meaningful answers using the same validation logic
    const meaningfulAnswers = answers.filter(answer => validateAnswer(answer || ''));
    
    const totalAnswerLength = answers.reduce((sum, answer) => sum + (answer ? answer.trim().length : 0), 0);
    const avgAnswerLength = answers.length > 0 ? totalAnswerLength / answers.length : 0;
    
    const results = {
        questions: questions.map(q => q.question),
        answers: answers,
        duration: interviewData.duration * 60 - timeRemaining,
        questionsAnswered: answers.filter(answer => answer && answer.trim()).length,
        meaningfulAnswers: meaningfulAnswers.length,
        avgAnswerLength: Math.round(avgAnswerLength),
        totalAnswerLength: totalAnswerLength,
        notes: notesEditor.getValue()
    };
    
    // STRICT warning system - warn user about certain failure
    if (meaningfulAnswers.length === 0) {
        const confirmProceed = confirm(
            "🚨 CRITICAL WARNING: You haven't provided ANY meaningful code solutions to the interview questions.\n\n" +
            "This will result in AUTOMATIC FAILURE with a score of 0.\n\n" +
            "Simply clicking 'Next' through coding challenges without writing actual code implementations defeats the purpose of interview practice.\n\n" +
            "❌ Click 'Cancel' to go back and write actual code solutions\n" +
            "⚠️ Click 'OK' only if you want to see the automatic failure result"
        );
        
        if (!confirmProceed) {
            return; // User chose to go back and answer questions
        }
    } else if (meaningfulAnswers.length < questions.length * 0.6) {
        const confirmProceed = confirm(
            `⚠️ FAILURE WARNING: You've only provided meaningful code solutions to ${meaningfulAnswers.length} out of ${questions.length} questions (${Math.round(meaningfulAnswers.length/questions.length*100)}%).\n\n` +
            "This will very likely result in a FAILING evaluation.\n\n" +
            "Real technical interviews require attempting ALL questions with actual code implementations.\n\n" +
            "❌ Click 'Cancel' to go back and complete more solutions\n" +
            "⚠️ Click 'OK' to proceed with likely failure"
        );
        
        if (!confirmProceed) {
            return; // User chose to go back and answer questions
        }
    } else if (meaningfulAnswers.length < questions.length) {
        const confirmProceed = confirm(
            `⚠️ Incomplete Interview: You've answered ${meaningfulAnswers.length} out of ${questions.length} questions with meaningful code.\n\n` +
            "While this shows effort, incomplete interviews typically receive lower scores.\n\n" +
            "🔄 Click 'Cancel' to finish the remaining questions\n" +
            "✅ Click 'OK' to proceed with evaluation"
        );
        
        if (!confirmProceed) {
            return; // User chose to go back and answer questions
        }
    }
    
    // Close end modal if open
    closeEndModal();
    
    // Show results modal
    document.getElementById('results-modal').classList.add('show');
    
    // Get AI evaluation
    await evaluatePerformance(results);
}

async function evaluatePerformance(results) {
    try {
        const evaluationData = {
            questions: results.questions,
            answers: results.answers,
            duration: `${Math.floor(results.duration / 60)} minutes`,
            questionsAnswered: results.questionsAnswered,
            totalQuestions: questions.length,
            answersProvided: results.questionsAnswered
        };
        
        // Show evaluation in progress
        const feedbackContent = document.getElementById('feedback-content');
        feedbackContent.innerHTML = `
            <div class="loading-feedback">
                <div class="spinner"></div>
                <p>AI is analyzing your performance...</p>
                <p><small>This may take 30-45 seconds for thorough evaluation</small></p>
            </div>
        `;
        
        const evaluation = await ipcRenderer.invoke('evaluate-performance', evaluationData);
        
        if (evaluation.success) {
            displayResults(evaluation.evaluation, false, evaluation.modelUsed);
            showNotification(`Evaluation completed using ${evaluation.modelUsed}`, 'success');
        } else {
            displayResults(evaluation.fallbackEvaluation, true);
            showNotification(evaluation.error || 'AI evaluation not available', 'warning');
        }
    } catch (error) {
        console.error('Evaluation error:', error);
        displayResults('Error occurred during evaluation. Please review your answers manually.', true);
        showNotification('Evaluation failed', 'error');
    }
}

function displayResults(evaluationText, isFallback = false, modelUsed = null) {
    const feedbackContent = document.getElementById('feedback-content');
    
    // Parse score from evaluation if available - more robust parsing
    const scoreMatch = evaluationText.match(/score[:\s]*(\d+)(?:\/100)?/i);
    let passMatch = evaluationText.match(/(?:status|result)[:\s]*(pass|fail)/i);
    
    // Fallback: look for standalone PASS/FAIL
    if (!passMatch) {
        passMatch = evaluationText.match(/\b(pass|fail)\b/i);
    }
    
    // Additional check for common evaluation patterns
    if (!passMatch) {
        if (evaluationText.toLowerCase().includes('❌') || evaluationText.toLowerCase().includes('below passing')) {
            passMatch = ['', 'fail'];
        } else if (evaluationText.toLowerCase().includes('✅') && evaluationText.toLowerCase().includes('meets basic requirements')) {
            passMatch = ['', 'pass'];
        }
    }
    
    if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        document.getElementById('score-value').textContent = score;
        
        // If no explicit pass/fail found, determine from score
        if (!passMatch && score !== null) {
            passMatch = ['', score >= 70 ? 'pass' : 'fail'];
        }
    } else {
        document.getElementById('score-value').textContent = '--';
    }
    
    if (passMatch) {
        const passFailElement = document.getElementById('pass-fail-status');
        const result = passMatch[1].toLowerCase();
        passFailElement.textContent = result.toUpperCase();
        passFailElement.className = `pass-fail ${result}`;
        
        // Add visual indicator
        if (result === 'fail') {
            passFailElement.style.background = '#fed7d7';
            passFailElement.style.color = '#c53030';
        } else {
            passFailElement.style.background = '#c6f6d5';
            passFailElement.style.color = '#22543d';
        }
    } else {
        // Default to fail if we can't determine result
        const passFailElement = document.getElementById('pass-fail-status');
        passFailElement.textContent = 'NEEDS REVIEW';
        passFailElement.className = 'pass-fail fail';
    }
    
    // Format and display feedback
    const formattedFeedback = formatEvaluationText(evaluationText, isFallback, modelUsed);
    feedbackContent.innerHTML = formattedFeedback;
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
    
    // Convert newlines to breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return `
        ${modelInfo}
        <div class="feedback-text" style="color: #4a5568;">${formatted}</div>
    `;
}

function exportResults() {
    const results = {
        interviewDate: new Date().toISOString(),
        duration: `${interviewData.duration} minutes`,
        questionsAnswered: answers.filter(answer => answer && answer.trim()).length,
        totalQuestions: questions.length,
        questions: questions.map(q => q.question),
        answers: answers,
        evaluation: document.getElementById('feedback-content').textContent,
        score: document.getElementById('score-value').textContent,
        status: document.getElementById('pass-fail-status').textContent
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `interview-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Results exported successfully', 'success');
}

async function newInterview() {
    try {
        await ipcRenderer.invoke('end-interview', {});
        window.close();
    } catch (error) {
        console.error('Error starting new interview:', error);
    }
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
