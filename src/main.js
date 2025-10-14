const { app } = require('electron');

// Import modular components
const { createMainWindow, createInterviewWindow } = require('./modules/windowManager');
const { setupAllFileHandlers } = require('./modules/fileHandlers');
const { setupAllAIHandlers } = require('./modules/aiHandlers');
const { setupAllInterviewHandlers } = require('./modules/interviewHandlers');

// Suppress cache warnings on Windows
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--no-sandbox');

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    console.log('Electron app is ready, creating main window...');
    
    // Setup all IPC handlers
    setupAllFileHandlers();
    setupAllAIHandlers();
    setupAllInterviewHandlers();
    
    // Create the main window
    createMainWindow();

    app.on('activate', () => {
        // On macOS, re-create a window when the dock icon is clicked
        const { getMainWindow } = require('./modules/windowManager');
        if (!getMainWindow()) {
            createMainWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS, keep the app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, url) => {
        event.preventDefault();
        console.log('Blocked new window creation to:', url);
    });
});

console.log('Main process initialized successfully');