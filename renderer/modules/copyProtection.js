/**
 * Copy Protection Module
 * Handles ultra-aggressive copy protection for interview questions
 */

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
    
    console.log('🛡️ Ultra-aggressive fallback protection applied successfully');
}

function protectQuestionContent(questionElement) {
    if (!questionElement) {
        console.warn('❌ No question element to protect');
        return;
    }
    
    console.log('🛡️ Applying production-grade question protection');
    
    // Apply base protection
    applyFallbackProtection(questionElement);
    
    // Additional production-specific protection
    questionElement.setAttribute('data-protected', 'true');
    questionElement.setAttribute('tabindex', '-1');
    
    // Prevent text selection via CSS injection
    const style = document.createElement('style');
    style.textContent = `
        .ultra-protected * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            pointer-events: none !important;
        }
        .ultra-protected {
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    // Monitor for attempts to modify protection
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                // Reapply protection if it's been tampered with
                applyFallbackProtection(questionElement);
            }
        });
    });
    
    observer.observe(questionElement, {
        attributes: true,
        subtree: true,
        attributeOldValue: true
    });
    
    console.log('🛡️ Production-grade question protection applied');
}

function applyQuestionProtection(questionContent) {
    // Apply ULTRA-AGGRESSIVE copy protection to question content in release builds
    // Use setTimeout to ensure DOM is fully updated before applying protection
    setTimeout(() => {
        if (typeof isProductionBuild === 'function' && isProductionBuild()) {
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
}

module.exports = {
    applyFallbackProtection,
    protectQuestionContent,
    applyQuestionProtection
};