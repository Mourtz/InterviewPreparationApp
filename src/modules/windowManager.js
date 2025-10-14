const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let interviewWindow;

function createMainWindow() {
    const isProduction = app.isPackaged;
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: !isProduction // Disable dev tools in production
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
        titleBarStyle: 'default',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

    // Disable dev tools and context menu in production
    if (isProduction) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (input.key === 'F12' || 
                (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
                (input.control && input.key === 'U')) {
                event.preventDefault();
            }
        });
        
        mainWindow.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
        
        // Disable menu bar
        mainWindow.setMenuBarVisibility(false);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open DevTools in development only
    if (process.argv.includes('--dev') && !isProduction) {
        mainWindow.webContents.openDevTools();
    }
}

function createInterviewWindow() {
    const isProduction = app.isPackaged;
    
    interviewWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: !isProduction // Disable dev tools in production
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
        titleBarStyle: 'default',
        show: false,
        fullscreenable: true,
        maximizable: true
    });

    interviewWindow.loadFile(path.join(__dirname, '../../renderer/interview.html'));

    // Apply same production restrictions
    if (isProduction) {
        interviewWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12' || 
                (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
                (input.control && input.key === 'U') ||
                input.key === 'F11' || // Disable F11 fullscreen
                (input.alt && input.key === 'F4')) { // Disable Alt+F4
                event.preventDefault();
            }
        });
        
        interviewWindow.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
        
        interviewWindow.setMenuBarVisibility(false);
    }

    interviewWindow.once('ready-to-show', () => {
        interviewWindow.show();
        // Hide main window when interview starts
        if (mainWindow) {
            mainWindow.hide();
        }
    });

    interviewWindow.on('closed', () => {
        interviewWindow = null;
        // Show main window when interview closes
        if (mainWindow) {
            mainWindow.show();
        }
    });

    // Open DevTools in development only
    if (process.argv.includes('--dev') && !isProduction) {
        interviewWindow.webContents.openDevTools();
    }
}

function getMainWindow() {
    return mainWindow;
}

function getInterviewWindow() {
    return interviewWindow;
}

function closeAllWindows() {
    if (interviewWindow) {
        interviewWindow.close();
    }
    if (mainWindow) {
        mainWindow.close();
    }
}

module.exports = {
    createMainWindow,
    createInterviewWindow,
    getMainWindow,
    getInterviewWindow,
    closeAllWindows
};