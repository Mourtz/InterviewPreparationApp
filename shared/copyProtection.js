// Copy Protection Utility for Interview Preparation App
// Prevents copying of question text and answers in release builds

/**
 * Detects if the app is running in production/release mode - ENHANCED VERSION
 */
function isProductionBuild() {
    // For Electron - multiple detection methods
    if (typeof require !== 'undefined') {
        try {
            const { app } = require('electron');
            // Primary check: packaged build
            const isPackaged = app?.isPackaged === true;
            
            // Secondary check: if we can't detect, look for other indicators
            if (isPackaged) {
                console.log('🔍 PRODUCTION BUILD DETECTED: app.isPackaged = true');
                return true;
            }
            
            // Additional Electron checks
            const execPath = process.execPath || '';
            const resourcesPath = process.resourcesPath || '';
            
            // Check if running from packaged location
            const isFromPackage = execPath.includes('Interview Preparation App') || 
                                 execPath.includes('.exe') ||
                                 resourcesPath.includes('app.asar');
            
            if (isFromPackage) {
                console.log('🔍 PRODUCTION BUILD DETECTED: Running from packaged executable');
                return true;
            }
            
            console.log('🔍 DEVELOPMENT BUILD DETECTED: app.isPackaged = false');
            return false;
            
        } catch (e) {
            console.log('🔍 Could not access electron app, using fallback detection');
        }
    }
    
    // For web version or fallback
    if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname.includes('localhost') || 
                           window.location.hostname.includes('127.0.0.1') ||
                           window.location.hostname.includes('0.0.0.0');
        
        // Also check for file:// protocol which indicates packaged app
        const isFileProtocol = window.location.protocol === 'file:';
        
        // Consider it production if not on localhost OR if using file protocol
        const isProduction = !isLocalhost || isFileProtocol;
        
        console.log('🔍 Web version detection:', {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            isLocalhost,
            isFileProtocol,
            isProduction
        });
        
        return isProduction;
    }
    
    // FORCE PRODUCTION MODE FOR TESTING - Remove this line in final release
    // Uncomment the line below to force production mode for testing:
    // return true;
    
    // Fallback: assume production if we can't determine
    // This ensures copy protection is enabled by default
    console.log('🔍 FALLBACK: Assuming production build');
    return true;
}

/**
 * Disables text selection on specified elements - Enhanced version
 */
function disableTextSelection(elements) {
    elements.forEach(element => {
        if (element) {
            // CSS-based text selection blocking
            element.style.userSelect = 'none';
            element.style.webkitUserSelect = 'none';
            element.style.mozUserSelect = 'none';
            element.style.msUserSelect = 'none';
            element.style.webkitTouchCallout = 'none';
            element.style.webkitUserDrag = 'none';
            element.style.khtmlUserSelect = 'none';
            
            // Event-based blocking
            element.onselectstart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            element.ondragstart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            
            // Mouse event blocking for text selection
            element.addEventListener('mousedown', (e) => {
                if (e.detail > 1) { // Prevent multi-click selections
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }, true);
            
            element.addEventListener('selectstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, true);
            
            // Prevent focus and blur that might enable selection
            element.addEventListener('focus', (e) => {
                if (element.hasAttribute('contenteditable')) {
                    element.blur();
                }
            }, true);
            
            console.log('🛡️ Enhanced text selection disabled for element:', element.tagName);
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
 * Disables common copy keyboard shortcuts - Enhanced version
 */
function disableCopyShortcuts(elements) {
    const copyShortcuts = ['c', 'a', 'x', 'v', 's']; // Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V, Ctrl+S
    const devShortcuts = ['i', 'j', 'u']; // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    
    elements.forEach(element => {
        if (element) {
            element.addEventListener('keydown', (e) => {
                // Block copy/paste shortcuts (both Ctrl and Cmd for Mac)
                if ((e.ctrlKey || e.metaKey) && copyShortcuts.includes(e.key.toLowerCase())) {
                    console.log('🚫 Copy shortcut blocked:', e.key);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    showCopyProtectionMessage();
                    return false;
                }
                
                // Block developer tools shortcuts
                if (((e.ctrlKey || e.metaKey) && e.shiftKey && devShortcuts.includes(e.key.toLowerCase())) ||
                    e.key === 'F12') {
                    console.log('🚫 Developer tools shortcut blocked:', e.key);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    showCopyProtectionMessage();
                    return false;
                }
                
                // Block print shortcuts
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                    console.log('🚫 Print shortcut blocked');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    showCopyProtectionMessage();
                    return false;
                }
            }, true);
        }
    });
}

/**
 * Disables developer tools (Electron only)
 */
function disableDevTools() {
    if (typeof require !== 'undefined') {
        try {
            const { webContents } = require('electron');
            // Disable dev tools for all web contents
            webContents.getAllWebContents().forEach(wc => {
                wc.closeDevTools();
                wc.setDevToolsWebContents(null);
            });
        } catch (e) {
            // Silently fail if not in Electron
        }
    }
    
    // For web version, override console and devtools detection
    if (typeof window !== 'undefined') {
        // Disable console methods
        const noop = () => {};
        window.console.log = noop;
        window.console.warn = noop;
        window.console.error = noop;
        window.console.debug = noop;
        window.console.info = noop;
        
        // Detect devtools opening and close them
        let devtools = {open: false, orientation: null};
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 160 || 
                window.outerWidth - window.innerWidth > 160) {
                if (!devtools.open) {
                    devtools.open = true;
                    // Try to close the window or redirect
                    window.location.href = 'about:blank';
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
}

/**
 * Applies copy protection to CodeMirror editor instances
 */
function protectCodeMirrorEditor(editor) {
    if (!editor || !isProductionBuild()) return;
    
    console.log('🛡️ Applying copy protection to CodeMirror editor');
    
    // Override copy/paste commands - block ALL copy operations in release builds
    editor.addKeyMap({
        'Ctrl-C': (cm) => {
            console.log('🚫 Copy operation blocked in release build');
            showCopyProtectionMessage();
            return false;
        },
        'Ctrl-A': (cm) => {
            console.log('🚫 Select all blocked in release build');
            showCopyProtectionMessage();
            return false;
        },
        'Ctrl-X': (cm) => {
            console.log('🚫 Cut operation blocked in release build');
            showCopyProtectionMessage();
            return false;
        },
        'Ctrl-V': () => false, // Allow paste for user input
        'Ctrl-S': () => false, // Block save shortcuts
        'F12': () => false,
        'Ctrl-Shift-I': () => false,
        'Ctrl-Shift-J': () => false,
        'Ctrl-U': () => false,
        'Cmd-C': (cm) => { // Mac support
            console.log('🚫 Copy operation blocked in release build (Mac)');
            showCopyProtectionMessage();
            return false;
        },
        'Cmd-A': (cm) => {
            console.log('🚫 Select all blocked in release build (Mac)');
            showCopyProtectionMessage();
            return false;
        },
        'Cmd-X': (cm) => {
            console.log('🚫 Cut operation blocked in release build (Mac)');
            showCopyProtectionMessage();
            return false;
        }
    });
    
    // Disable text selection on the editor wrapper for questions only
    const wrapper = editor.getWrapperElement();
    if (wrapper) {
        disableContextMenu([wrapper]);
        
        // For answer editors, allow typing but prevent copying
        wrapper.addEventListener('mousedown', (e) => {
            // Allow clicking for cursor placement but prevent text selection
            if (e.detail > 1) { // Double-click or triple-click
                e.preventDefault();
                return false;
            }
        });
    }
    
    // Override clipboard operations
    editor.on('copy', (cm) => {
        console.log('🚫 CodeMirror copy event blocked');
        showCopyProtectionMessage();
        return false;
    });
    
    editor.on('cut', (cm) => {
        console.log('🚫 CodeMirror cut event blocked');
        showCopyProtectionMessage();
        return false;
    });
    
    // Block large text selections - prevent copying entire questions/answers
    editor.on('beforeSelectionChange', (cm, obj) => {
        if (obj.ranges && obj.ranges[0]) {
            const range = obj.ranges[0];
            const selectionLength = cm.getRange(range.anchor, range.head).length;
            
            // In release builds, prevent selecting more than 20 characters at once
            if (selectionLength > 20) {
                console.log('🚫 Large text selection blocked:', selectionLength, 'characters');
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
 * Ultra-aggressive protection specifically for question content
 */
function protectQuestionContent(element) {
    if (!element || !isProductionBuild()) return;
    
    console.log('🛡️ Applying ULTRA-AGGRESSIVE question content protection');
    
    // Apply all basic protections
    disableTextSelection([element]);
    disableContextMenu([element]);
    disableCopyShortcuts([element]);
    
    // Add protection class
    element.classList.add('copy-protected', 'ultra-protected');
    
    // Make the element completely unselectable at every level
    element.setAttribute('unselectable', 'on');
    element.setAttribute('onselectstart', 'return false;');
    element.setAttribute('onmousedown', 'return false;');
    element.setAttribute('ondragstart', 'return false;');
    element.setAttribute('oncontextmenu', 'return false;');
    
    // Override CSS to prevent any text selection
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
    
    // Block all mouse events that could lead to text selection
    const blockEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showCopyProtectionMessage();
        return false;
    };
    
    // Override any existing event handlers with protection
    element.addEventListener('click', blockEvent, true);
    element.addEventListener('dblclick', blockEvent, true);
    element.addEventListener('mousedown', blockEvent, true);
    element.addEventListener('mouseup', blockEvent, true);
    element.addEventListener('selectstart', blockEvent, true);
    element.addEventListener('dragstart', blockEvent, true);
    element.addEventListener('contextmenu', blockEvent, true);
    element.addEventListener('copy', blockEvent, true);
    element.addEventListener('cut', blockEvent, true);
    
    // Protect all existing child elements recursively
    function protectElementRecursive(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        
        disableTextSelection([el]);
        disableContextMenu([el]);
        el.classList.add('copy-protected', 'ultra-protected');
        el.setAttribute('unselectable', 'on');
        
        el.style.cssText += `
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-drag: none !important;
        `;
        
        // Apply protection to child elements
        el.addEventListener('click', blockEvent, true);
        el.addEventListener('dblclick', blockEvent, true);
        el.addEventListener('mousedown', blockEvent, true);
        el.addEventListener('mouseup', blockEvent, true);
        el.addEventListener('selectstart', blockEvent, true);
        el.addEventListener('dragstart', blockEvent, true);
        el.addEventListener('contextmenu', blockEvent, true);
        el.addEventListener('copy', blockEvent, true);
        el.addEventListener('cut', blockEvent, true);
        
        // Recursively protect children
        Array.from(el.children).forEach(protectElementRecursive);
    }
    
    // Protect all children
    Array.from(element.children).forEach(protectElementRecursive);
    
    // Monitor for new children and protect them
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    protectElementRecursive(node);
                }
            });
        });
    });
    
    observer.observe(element, { childList: true, subtree: true });
    
    console.log('🛡️ Ultra-aggressive protection applied to question content');
}

/**
 * Forces production mode for testing - call this to test copy protection in development
 */
function forceProductionModeForTesting() {
    console.log('🔧 FORCING PRODUCTION MODE FOR TESTING');
    window._forceProductionMode = true;
    // Re-enable copy protection
    enableCopyProtection();
}

/**
 * Enhanced production build detection that can be forced for testing
 */
function isProductionBuildEnhanced() {
    // Check if we're forcing production mode for testing
    if (typeof window !== 'undefined' && window._forceProductionMode === true) {
        console.log('🔧 FORCED PRODUCTION MODE ACTIVE');
        return true;
    }
    
    return isProductionBuild();
}



/**
 * Main function to enable copy protection
 */
function enableCopyProtection() {
    if (!isProductionBuild()) {
        console.log('🛡️ Copy protection disabled in development mode');
        return;
    }
    
    console.log('🛡️ Enabling AGGRESSIVE copy protection for release build');
    
    // Disable dev tools
    disableDevTools();
    
    // Protect question content with aggressive methods
    const questionContent = document.getElementById('question-content');
    if (questionContent) {
        protectQuestionContent(questionContent);
        console.log('🛡️ Question content protected with aggressive methods');
    }
    
    // Protect the entire document from global copy operations
    disableContextMenu([document.body]);
    disableCopyShortcuts([document.body]);
    
    // Add global document-level copy blocking
    document.addEventListener('copy', (e) => {
        console.log('🚫 Global copy operation blocked');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showCopyProtectionMessage();
        return false;
    }, true);
    
    document.addEventListener('cut', (e) => {
        console.log('🚫 Global cut operation blocked');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showCopyProtectionMessage();
        return false;
    }, true);
    
    document.addEventListener('selectstart', (e) => {
        // Allow selection in answer fields but block in question areas
        if (e.target.closest('#question-content') || e.target.classList.contains('copy-protected')) {
            console.log('🚫 Text selection blocked in protected area');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);
    
    document.addEventListener('dragstart', (e) => {
        if (e.target.closest('#question-content') || e.target.classList.contains('copy-protected')) {
            console.log('🚫 Drag operation blocked in protected area');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);
    
    // Override window selection API
    if (window.getSelection) {
        const originalGetSelection = window.getSelection;
        window.getSelection = function() {
            const selection = originalGetSelection.call(this);
            if (selection && selection.toString()) {
                const range = selection.getRangeAt ? selection.getRangeAt(0) : null;
                if (range && range.commonAncestorContainer) {
                    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
                        ? range.commonAncestorContainer.parentElement 
                        : range.commonAncestorContainer;
                    
                    if (container && (container.closest('#question-content') || container.classList.contains('copy-protected'))) {
                        console.log('🚫 Selection API blocked for protected content');
                        selection.removeAllRanges();
                        showCopyProtectionMessage();
                        return null;
                    }
                }
            }
            return selection;
        };
    }
    
    // Override clipboard API
    if (navigator.clipboard) {
        const originalWriteText = navigator.clipboard.writeText;
        const originalWrite = navigator.clipboard.write;
        const originalReadText = navigator.clipboard.readText;
        
        navigator.clipboard.writeText = function(text) {
            console.log('🚫 Clipboard writeText blocked');
            showCopyProtectionMessage();
            return Promise.reject(new Error('Copy protection active'));
        };
        
        navigator.clipboard.write = function(data) {
            console.log('🚫 Clipboard write blocked');
            showCopyProtectionMessage();
            return Promise.reject(new Error('Copy protection active'));
        };
        
        // Allow reading clipboard for paste operations
        navigator.clipboard.readText = originalReadText;
    }
    
    // Override document.execCommand for legacy copy operations
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, showUI, value) {
        if (command === 'copy' || command === 'cut' || command === 'selectAll') {
            console.log('🚫 execCommand blocked:', command);
            showCopyProtectionMessage();
            return false;
        }
        return originalExecCommand.call(this, command, showUI, value);
    };
    
    // Add enhanced visual indicator and styles for protected content
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
            pointer-events: auto;
        }
        
        .ultra-protected {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-drag: none !important;
            pointer-events: none !important;
            cursor: default !important;
        }
        
        .ultra-protected * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-drag: none !important;
            pointer-events: none !important;
            cursor: default !important;
        }
        
        .copy-protected::before {
            content: '🛡️';
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 12px;
            opacity: 0.5;
            pointer-events: none;
            z-index: 1000;
            background: rgba(0,0,0,0.1);
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .copy-protected * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
        }
        
        /* Prevent text highlighting - Multiple approaches */
        .copy-protected::selection,
        .copy-protected *::selection {
            background: transparent !important;
            color: inherit !important;
        }
        
        .copy-protected::-moz-selection,
        .copy-protected *::-moz-selection {
            background: transparent !important;
            color: inherit !important;
        }
        
        .copy-protected::-webkit-selection,
        .copy-protected *::-webkit-selection {
            background: transparent !important;
            color: inherit !important;
        }
        
        /* Disable contenteditable if somehow enabled */
        .copy-protected[contenteditable="true"] {
            contenteditable: false !important;
        }
        
        /* Hide any copy buttons or indicators */
        .copy-protected .copy-button,
        .copy-protected [data-copy],
        .copy-protected [title*="copy"],
        .copy-protected [aria-label*="copy"] {
            display: none !important;
        }
        
        /* Prevent mouse selection gestures */
        .copy-protected {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -khtml-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Add protection class to question content
    if (questionContent) {
        questionContent.classList.add('copy-protected');
    }
    
    // Disable print functionality
    const originalPrint = window.print;
    window.print = () => {
        console.log('🚫 Print functionality blocked in release build');
        alert('🛡️ Printing is disabled during the interview session for security purposes.');
        return false;
    };
    
    // Disable drag and drop
    document.addEventListener('dragstart', (e) => {
        console.log('🚫 Drag operation blocked');
        e.preventDefault();
        return false;
    });
    
    // Monitor and block clipboard operations
    if (navigator.clipboard) {
        const originalWriteText = navigator.clipboard.writeText;
        const originalRead = navigator.clipboard.read;
        const originalReadText = navigator.clipboard.readText;
        
        navigator.clipboard.writeText = () => {
            console.log('🚫 Clipboard write blocked');
            showCopyProtectionMessage();
            return Promise.reject(new Error('Clipboard access disabled during interview'));
        };
        
        navigator.clipboard.read = () => {
            console.log('🚫 Clipboard read blocked');
            return Promise.reject(new Error('Clipboard access disabled during interview'));
        };
        
        navigator.clipboard.readText = () => {
            console.log('🚫 Clipboard read text blocked');
            return Promise.reject(new Error('Clipboard access disabled during interview'));
        };
    }
    
    // Block common selection methods
    document.addEventListener('selectstart', (e) => {
        if (e.target.closest('.copy-protected')) {
            console.log('🚫 Text selection blocked on protected content');
            e.preventDefault();
            return false;
        }
    });
    
    // Monitor for attempts to programmatically select text
    const originalSelect = window.getSelection;
    window.getSelection = () => {
        const selection = originalSelect.call(window);
        if (selection.toString().length > 20) {
            console.log('🚫 Large programmatic selection blocked');
            selection.removeAllRanges();
            showCopyProtectionMessage();
        }
        return selection;
    };
    
    // Block common developer shortcuts globally
    document.addEventListener('keydown', (e) => {
        // Additional shortcuts to block
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
            console.log('🚫 Blocked keyboard shortcut:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
            e.preventDefault();
            e.stopPropagation();
            showCopyProtectionMessage();
            return false;
        }
    }, true);
    
    // Monitor for question content changes and re-apply protection immediately
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Protect any new question content immediately
                    const questionElements = node.querySelectorAll ? 
                        node.querySelectorAll('.question-text, .question-content, #question-content, [id*="question"]') : [];
                    questionElements.forEach(el => {
                        protectQuestionContent(el);
                        console.log('🛡️ Protected new question element with aggressive methods');
                    });
                    
                    // If this is question content itself
                    if (node.id === 'question-content' || node.classList.contains('question-content')) {
                        protectQuestionContent(node);
                        console.log('🛡️ Protected question content with aggressive methods');
                    }
                }
            });
            
            // Also check for text changes in existing question content
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const questionContent = document.getElementById('question-content');
                if (questionContent && mutation.target.closest('#question-content')) {
                    // Re-apply protection to ensure new text is protected
                    setTimeout(() => {
                        protectQuestionContent(questionContent);
                        console.log('🛡️ Re-applied protection after content change');
                    }, 10);
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Also protect any existing question content immediately
    const existingQuestionContent = document.getElementById('question-content');
    if (existingQuestionContent) {
        protectQuestionContent(existingQuestionContent);
        console.log('🛡️ Protected existing question content with aggressive methods');
    }
    
    console.log('🛡️ AGGRESSIVE copy protection enabled for interview session');
}

/**
 * Protects CodeMirror editors after they are initialized
 */
function protectEditors(answerEditor, notesEditor) {
    if (!isProductionBuild()) {
        console.log('🛡️ Editor protection disabled in development mode');
        return;
    }
    
    console.log('🛡️ Applying copy protection to editors');
    
    if (answerEditor) {
        // For answer editor: Allow typing and small selections for editing,
        // but prevent copying large blocks of text
        protectCodeMirrorEditor(answerEditor);
        console.log('🛡️ Answer editor protected - typing allowed, copying blocked');
    }
    
    if (notesEditor) {
        // For notes editor: Allow normal operation but prevent copying
        protectCodeMirrorEditor(notesEditor);
        console.log('🛡️ Notes editor protected - typing allowed, copying blocked');
    }
}

/**
 * Shows a brief message when copy protection is triggered
 */
function showCopyProtectionMessage() {
    // Don't spam messages
    if (typeof window !== 'undefined' && window.copyProtectionMessageShown) return;
    if (typeof window !== 'undefined') window.copyProtectionMessageShown = true;
    
    // Create a strong warning notification
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 0, 0, 0.95);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 99999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        animation: fadeInOut 4s ease-in-out;
        border: 2px solid rgba(255,255,255,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        max-width: 300px;
    `;
    message.textContent = '🛡️ Copy Protection Active\nContent cannot be copied during interview';
    
    // Add CSS animation if not already added
    if (!document.getElementById('copy-protection-style')) {
        const style = document.createElement('style');
        style.id = 'copy-protection-style';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
                15% { opacity: 1; transform: translateY(0) scale(1); }
                85% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
        if (typeof window !== 'undefined') window.copyProtectionMessageShown = false;
    }, 4000);
    
    console.log('🛡️ Copy protection warning message displayed');
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isProductionBuild,
        isProductionBuildEnhanced,
        enableCopyProtection,
        protectEditors,
        disableTextSelection,
        disableContextMenu,
        disableCopyShortcuts,
        protectCodeMirrorEditor,
        protectQuestionContent,
        showCopyProtectionMessage,
        forceProductionModeForTesting
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.CopyProtection = {
        isProductionBuild,
        isProductionBuildEnhanced,
        enableCopyProtection,
        protectEditors,
        disableTextSelection,
        disableContextMenu,
        disableCopyShortcuts,
        protectCodeMirrorEditor,
        protectQuestionContent,
        showCopyProtectionMessage,
        forceProductionModeForTesting
    };
}
