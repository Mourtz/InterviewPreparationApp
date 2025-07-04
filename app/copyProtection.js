// Copy Protection for Web Version - Interview Preparation App
// This is a simplified version that works without Node.js require()

// Copy Protection Utility for Web Version
(function() {
    'use strict';

    /**
     * Detects if the app is running in production/release mode for web
     */
    function isProductionBuild() {
        // For web version, check if running from localhost/dev server vs production domain
        return !window.location.hostname.includes('localhost') && 
               !window.location.hostname.includes('127.0.0.1') &&
               !window.location.hostname.includes('0.0.0.0') &&
               window.location.protocol !== 'file:';
    }

    /**
     * Disables text selection on specified elements
     */
    function disableTextSelection(elements) {
        elements.forEach(element => {
            if (element) {
                element.style.userSelect = 'none';
                element.style.webkitUserSelect = 'none';
                element.style.mozUserSelect = 'none';
                element.style.msUserSelect = 'none';
                element.style.webkitTouchCallout = 'none';
                element.style.webkitUserDrag = 'none';
                element.style.khtmlUserSelect = 'none';
                element.onselectstart = () => false;
                element.ondragstart = () => false;
            }
        });
    }

    /**
     * Disables context menu (right-click) on specified elements
     */
    function disableContextMenu(elements) {
        elements.forEach(element => {
            if (element) {
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }, true);
            }
        });
    }

    /**
     * Disables common copy keyboard shortcuts
     */
    function disableCopyShortcuts(elements) {
        const copyShortcuts = ['c', 'a', 'x', 'v', 's']; // Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V, Ctrl+S
        const devShortcuts = ['i', 'j', 'u']; // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        
        elements.forEach(element => {
            if (element) {
                element.addEventListener('keydown', (e) => {
                    // Disable copy/paste shortcuts
                    if (e.ctrlKey && copyShortcuts.includes(e.key.toLowerCase())) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    
                    // Disable developer tools shortcuts
                    if ((e.ctrlKey && e.shiftKey && devShortcuts.includes(e.key.toLowerCase())) ||
                        e.key === 'F12') {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    
                    // Disable print shortcuts
                    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }, true);
            }
        });
    }

    /**
     * Disables developer tools (Web version)
     */
    function disableDevTools() {
        // Disable console methods
        const noop = () => {};
        const originalConsole = window.console;
        window.console = {
            ...originalConsole,
            log: noop,
            warn: noop,
            error: noop,
            debug: noop,
            info: noop,
            clear: noop
        };
        
        // Detect devtools opening and close them
        let devtools = {open: false};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    // Show warning message instead of closing
                    alert('Developer tools are disabled during interview sessions for security purposes.');
                    // Try to minimize the impact
                    document.body.style.filter = 'blur(10px)';
                    setTimeout(() => {
                        document.body.style.filter = 'none';
                    }, 2000);
                }
            } else {
                devtools.open = false;
            }
        }, 500);
        
        // Disable right-click globally
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }

    /**
     * Applies copy protection to CodeMirror editor instances
     */
    function protectCodeMirrorEditor(editor) {
        if (!editor || !editor.addKeyMap || !isProductionBuild()) return;
        
        console.log('🛡️ Applying copy protection to CodeMirror editor (web)');
        
        // Override copy/paste commands - block ALL copy operations in release builds
        editor.addKeyMap({
            'Ctrl-C': (cm) => {
                console.log('🚫 Copy operation blocked in release build (web)');
                showCopyProtectionMessage();
                return false;
            },
            'Ctrl-A': (cm) => {
                console.log('🚫 Select all blocked in release build (web)');
                showCopyProtectionMessage();
                return false;
            },
            'Ctrl-X': (cm) => {
                console.log('🚫 Cut operation blocked in release build (web)');
                showCopyProtectionMessage();
                return false;
            },
            'Ctrl-V': () => false, // Allow paste for user input
            'Ctrl-S': () => false,
            'F12': () => false,
            'Ctrl-Shift-I': () => false,
            'Ctrl-Shift-J': () => false,
            'Ctrl-U': () => false,
            'Cmd-C': (cm) => { // Mac support
                console.log('🚫 Copy operation blocked in release build (Mac web)');
                showCopyProtectionMessage();
                return false;
            },
            'Cmd-A': (cm) => {
                console.log('🚫 Select all blocked in release build (Mac web)');
                showCopyProtectionMessage();
                return false;
            },
            'Cmd-X': (cm) => {
                console.log('🚫 Cut operation blocked in release build (Mac web)');
                showCopyProtectionMessage();
                return false;
            }
        });
        
        // Disable text selection on the editor wrapper
        const wrapper = editor.getWrapperElement();
        if (wrapper) {
            disableContextMenu([wrapper]);
            
            // For answer editors, allow typing but prevent text selection
            wrapper.addEventListener('mousedown', (e) => {
                if (e.detail > 1) { // Double-click or triple-click
                    e.preventDefault();
                    return false;
                }
            });
        }
        
        // Override clipboard operations
        editor.on('copy', (cm) => {
            console.log('🚫 CodeMirror copy event blocked (web)');
            showCopyProtectionMessage();
            return false;
        });
        
        editor.on('cut', (cm) => {
            console.log('🚫 CodeMirror cut event blocked (web)');
            showCopyProtectionMessage();
            return false;
        });
        
        // Prevent large text selections - prevent copying entire questions/answers
        editor.on('beforeSelectionChange', (cm, obj) => {
            if (obj.ranges && obj.ranges[0]) {
                const range = obj.ranges[0];
                const selectionLength = cm.getRange(range.anchor, range.head).length;
                if (selectionLength > 20) { // Very strict in release builds
                    console.log('🚫 Large text selection blocked (web):', selectionLength, 'characters');
                    showCopyProtectionMessage();
                    obj.update([{
                        anchor: range.anchor,
                        head: range.anchor
                    }]);
                }
            }
        });
    }

    /**
     * Shows a brief message when copy protection is triggered
     */
    function showCopyProtectionMessage() {
        // Don't spam messages
        if (window.copyProtectionMessageShown) return;
        window.copyProtectionMessageShown = true;
        
        // Create a subtle notification
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: fadeInOut 3s ease-in-out;
        `;
        message.textContent = '🛡️ Copy protection active during interview';
        
        // Add CSS animation
        if (!document.getElementById('copy-protection-style')) {
            const style = document.createElement('style');
            style.id = 'copy-protection-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-10px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
            window.copyProtectionMessageShown = false;
        }, 3000);
    }

    /**
     * Main function to enable copy protection
     */
    function enableCopyProtection() {
        if (!isProductionBuild()) {
            console.log('🛡️ Copy protection disabled in development mode');
            return;
        }
        
        console.log('🛡️ Enabling comprehensive copy protection for release build (web)');
        
        // Disable dev tools
        disableDevTools();
        
        // Protect the entire document from global copy operations
        disableContextMenu([document.body]);
        disableCopyShortcuts([document.body]);
        
        // Add enhanced protection styles
        const style = document.createElement('style');
        style.textContent = `
            .copy-protected {
                position: relative;
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-user-drag: none !important;
            }
            
            .copy-protected::before {
                content: '🛡️';
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 12px;
                opacity: 0.3;
                pointer-events: none;
                z-index: 1000;
            }
            
            .copy-protected * {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-touch-callout: none !important;
            }
            
            /* Prevent text highlighting */
            .copy-protected::selection,
            .copy-protected *::selection {
                background: transparent !important;
            }
            
            .copy-protected::-moz-selection,
            .copy-protected *::-moz-selection {
                background: transparent !important;
            }
            
            /* Hide any copy buttons or indicators */
            .copy-protected .copy-button,
            .copy-protected [data-copy],
            .copy-protected [title*="copy"],
            .copy-protected [aria-label*="copy"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Disable print functionality
        const originalPrint = window.print;
        window.print = () => {
            console.log('🚫 Print functionality blocked in release build (web)');
            alert('🛡️ Printing is disabled during the interview session for security purposes.');
            return false;
        };
        
        // Disable drag and drop
        document.addEventListener('dragstart', (e) => {
            console.log('🚫 Drag operation blocked (web)');
            e.preventDefault();
            return false;
        });
        
        // Monitor and block clipboard operations - EXCEPT for input fields
        if (navigator.clipboard) {
            const originalWriteText = navigator.clipboard.writeText;
            const originalRead = navigator.clipboard.read;
            const originalReadText = navigator.clipboard.readText;
            
            navigator.clipboard.writeText = () => {
                console.log('🚫 Clipboard write blocked (web)');
                showCopyProtectionMessage();
                return Promise.reject(new Error('Clipboard access disabled during interview'));
            };
            
            navigator.clipboard.read = () => {
                console.log('🚫 Clipboard read blocked (web)');
                return Promise.reject(new Error('Clipboard access disabled during interview'));
            };
            
            navigator.clipboard.readText = () => {
                // Allow clipboard reading in specific contexts (for paste operations in input fields)
                const activeElement = document.activeElement;
                if (activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.id === 'api-key' ||
                    activeElement.classList.contains('CodeMirror-code') ||
                    activeElement.classList.contains('paste-allowed') ||
                    activeElement.closest('.CodeMirror')
                )) {
                    console.log('✅ Clipboard read allowed for input field (web):', activeElement.tagName, activeElement.id);
                    return originalReadText.call(navigator.clipboard);
                }
                
                console.log('🚫 Clipboard read text blocked (web)');
                return Promise.reject(new Error('Clipboard access disabled during interview'));
            };
        }
        
        // Block common selection methods
        document.addEventListener('selectstart', (e) => {
            if (e.target.closest('.copy-protected')) {
                console.log('🚫 Text selection blocked on protected content (web)');
                e.preventDefault();
                return false;
            }
        });
        
        // Monitor for attempts to programmatically select text
        const originalSelect = window.getSelection;
        window.getSelection = () => {
            const selection = originalSelect.call(window);
            if (selection.toString().length > 20) {
                console.log('🚫 Large programmatic selection blocked (web)');
                selection.removeAllRanges();
                showCopyProtectionMessage();
            }
            return selection;
        };
        
        // Allow paste operations in input fields
        document.addEventListener('paste', (e) => {
            const activeElement = e.target;
            const isInputField = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.id === 'api-key' ||
                activeElement.classList.contains('paste-allowed') ||
                activeElement.classList.contains('CodeMirror-code') ||
                activeElement.closest('.CodeMirror')
            );
            
            if (isInputField) {
                console.log('✅ Paste operation allowed in input field (web):', activeElement.tagName, activeElement.id);
                return true; // Allow the paste operation
            } else {
                console.log('🚫 Paste operation blocked in protected area (web)');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                showCopyProtectionMessage();
                return false;
            }
        }, true);
        
        // Block common developer and copy shortcuts globally
        document.addEventListener('keydown', (e) => {
            // Allow paste operations in input fields
            const activeElement = document.activeElement;
            const isInputField = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.id === 'api-key' ||
                activeElement.classList.contains('CodeMirror-code') ||
                activeElement.classList.contains('paste-allowed') ||
                activeElement.closest('.CodeMirror')
            );
            
            // Allow Ctrl+V (paste) in input fields
            if (isInputField && ((e.ctrlKey && e.key === 'v') || (e.ctrlKey && e.key === 'V') || 
                                 (e.metaKey && e.key === 'v') || (e.metaKey && e.key === 'V'))) {
                console.log('✅ Paste operation allowed in input field (web):', activeElement.tagName, activeElement.id);
                return true; // Allow the paste operation
            }
            
            const blockedCombos = [
                // Developer tools
                (e.key === 'F12'),
                (e.ctrlKey && e.shiftKey && e.key === 'I'),
                (e.ctrlKey && e.shiftKey && e.key === 'J'),
                (e.ctrlKey && e.shiftKey && e.key === 'C'),
                (e.ctrlKey && e.key === 'U'),
                
                // Copy operations
                (e.ctrlKey && e.key === 'c'),
                (e.ctrlKey && e.key === 'C'),
                (e.ctrlKey && e.key === 'a'),
                (e.ctrlKey && e.key === 'A'),
                (e.ctrlKey && e.key === 'x'),
                (e.ctrlKey && e.key === 'X'),
                
                // Mac shortcuts
                (e.metaKey && e.key === 'c'),
                (e.metaKey && e.key === 'C'),
                (e.metaKey && e.key === 'a'),
                (e.metaKey && e.key === 'A'),
                (e.metaKey && e.key === 'x'),
                (e.metaKey && e.key === 'X'),
                
                // Print
                (e.ctrlKey && e.key === 'p'),
                (e.ctrlKey && e.key === 'P'),
                (e.metaKey && e.key === 'p'),
                (e.metaKey && e.key === 'P')
            ];
            
            if (blockedCombos.some(combo => combo)) {
                console.log('🚫 Blocked keyboard shortcut (web):', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
                e.preventDefault();
                e.stopPropagation();
                showCopyProtectionMessage();
                return false;
            }
        }, true);
        
        // Protect question content when it appears
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for question content
                        const questionElements = node.querySelectorAll ? 
                            node.querySelectorAll('.question-text, .question-content, #question-content, [id*="question"]') : [];
                        questionElements.forEach(el => {
                            disableTextSelection([el]);
                            disableContextMenu([el]);
                            disableCopyShortcuts([el]);
                            el.classList.add('copy-protected');
                            console.log('🛡️ Protected new question element (web)');
                        });
                        
                        // If this is question content itself
                        if (node.id === 'question-content' || node.classList.contains('question-content')) {
                            disableTextSelection([node]);
                            disableContextMenu([node]);
                            disableCopyShortcuts([node]);
                            node.classList.add('copy-protected');
                            console.log('🛡️ Protected question content (web)');
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('🛡️ Comprehensive copy protection enabled for interview session (web)');
    }

    /**
     * Protects CodeMirror editors after they are initialized
     */
    function protectEditors(answerEditor, notesEditor) {
        if (!isProductionBuild()) {
            return;
        }
        
        if (answerEditor) {
            protectCodeMirrorEditor(answerEditor);
            console.log('🛡️ Answer editor protected from copying');
        }
        
        if (notesEditor) {
            protectCodeMirrorEditor(notesEditor);
            console.log('🛡️ Notes editor protected from copying');
        }
    }

    // Make functions available globally for web version
    window.CopyProtection = {
        isProductionBuild,
        enableCopyProtection,
        protectEditors,
        disableTextSelection,
        disableContextMenu,
        disableCopyShortcuts,
        protectCodeMirrorEditor
    };

    // Auto-enable copy protection when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableCopyProtection);
    } else {
        enableCopyProtection();
    }

})();
