/**
 * Editor Manager Module
 * Handles CodeMirror editor initialization and management
 */

let answerEditor = null;
let notesEditor = null;
let editorMode = 'text'; // 'text' or 'code'

function initializeEditors(interviewData) {
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
    
    console.log(`🔧 Initializing editors with language: ${selectedLanguage}, mode: ${codeMode}`);
    
    // Initialize answer editor with programming-specific settings
    const answerTextarea = document.getElementById('answer');
    if (answerTextarea) {
        try {
            answerEditor = CodeMirror.fromTextArea(answerTextarea, {
                mode: codeMode,
                theme: 'default',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false,
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                extraKeys: {
                    "Ctrl-Space": "autocomplete",
                    "Tab": "indentMore",
                    "Shift-Tab": "indentLess",
                    "Ctrl-/": "toggleComment"
                },
                placeholder: `Write your ${selectedLanguage} solution here...`
            });
            
            // Set editor height
            answerEditor.setSize(null, "400px");
            
            // Add event listeners for auto-save
            answerEditor.on('change', () => {
                // Auto-save functionality would go here
                console.log('📝 Answer editor content changed');
            });
            
            console.log('✅ Answer editor initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize answer editor:', error);
        }
    }
    
    // Initialize notes editor (simpler text mode)
    const notesTextarea = document.getElementById('notes');
    if (notesTextarea) {
        try {
            notesEditor = CodeMirror.fromTextArea(notesTextarea, {
                mode: 'text/plain',
                theme: 'default',
                lineNumbers: false,
                lineWrapping: true,
                placeholder: 'Take notes here (optional)...'
            });
            
            notesEditor.setSize(null, "150px");
            
            console.log('✅ Notes editor initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize notes editor:', error);
        }
    }
    
    // Add keyboard shortcut handlers
    document.addEventListener('keydown', handleEditorShortcuts);
}

function handleEditorShortcuts(event) {
    // Ctrl/Cmd + S to save (prevent browser save dialog)
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveCurrentAnswer();
        return false;
    }
    
    // F11 for fullscreen mode toggle
    if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
        return false;
    }
}

function saveCurrentAnswer() {
    if (answerEditor) {
        const content = answerEditor.getValue();
        console.log('💾 Saving current answer...');
        // The actual save logic would be handled by the parent module
        return content;
    }
    return '';
}

function loadAnswerContent(content) {
    if (answerEditor && content) {
        answerEditor.setValue(content);
        setTimeout(() => {
            answerEditor.refresh();
            answerEditor.focus();
            console.log('📝 Answer content loaded and editor focused');
        }, 100);
    }
}

function clearAnswerEditor() {
    if (answerEditor) {
        answerEditor.setValue('');
        answerEditor.refresh();
        answerEditor.focus();
    }
}

function toggleFullscreen() {
    const editorWrapper = answerEditor?.getWrapperElement();
    if (!editorWrapper) return;
    
    if (editorWrapper.classList.contains('fullscreen')) {
        // Exit fullscreen
        editorWrapper.classList.remove('fullscreen');
        editorWrapper.style.cssText = '';
        document.body.style.overflow = '';
    } else {
        // Enter fullscreen
        editorWrapper.classList.add('fullscreen');
        editorWrapper.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            background: white !important;
        `;
        document.body.style.overflow = 'hidden';
        answerEditor.refresh();
        answerEditor.focus();
    }
}

function refreshEditors() {
    if (answerEditor) {
        answerEditor.refresh();
    }
    if (notesEditor) {
        notesEditor.refresh();
    }
}

function getAnswerEditor() {
    return answerEditor;
}

function getNotesEditor() {
    return notesEditor;
}

function getCurrentAnswer() {
    return answerEditor ? answerEditor.getValue() : '';
}

function getCurrentNotes() {
    return notesEditor ? notesEditor.getValue() : '';
}

function setEditorMode(mode) {
    editorMode = mode;
    if (answerEditor) {
        const modeMap = {
            'text': 'text/plain',
            'code': answerEditor.getOption('mode') // Keep current programming language mode
        };
        answerEditor.setOption('mode', modeMap[mode] || 'text/plain');
    }
}

module.exports = {
    initializeEditors,
    saveCurrentAnswer,
    loadAnswerContent,
    clearAnswerEditor,
    toggleFullscreen,
    refreshEditors,
    getAnswerEditor,
    getNotesEditor,
    getCurrentAnswer,
    getCurrentNotes,
    setEditorMode
};