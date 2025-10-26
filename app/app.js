/**
 * Interview Preparation App - Web Version (Refactored)
 * 
 * This is the main entry point for the web-based interview application.
 * It uses a modular architecture with separate modules for different functionalities.
 * 
 * Author: Interview Preparation Team
 * Version: 2.0.0
 * License: MIT
 */

// Import the main application class and initialize
const InterviewApp = require('./modules/interviewApp');

// Configuration
const CONFIG = {
    DEBUG: true,
    VERSION: '2.0.0',
    DEFAULT_PROVIDER: 'lmstudio',
    FALLBACK_ENABLED: true,
    AUTO_SAVE: true,
    THEME: 'professional'
};

console.log('🎯 Interview Preparation App - Web Version');
console.log(`📦 Version: ${CONFIG.VERSION}`);
console.log('🚀 Loading modular components...');

// Global application instance
let interviewApp = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        interviewApp = new InterviewApp();
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
    }
});

// Export for testing/external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InterviewApp,
        CONFIG,
        getApp: () => interviewApp
    };
}