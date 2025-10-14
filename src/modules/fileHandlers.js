const { ipcMain, dialog } = require('electron');
const path = require('path');
const { extractTextFromFile } = require('../../shared/fileUtils');
const { extractProgrammingLanguages } = require('../../shared/languageUtils');
const { getMainWindow } = require('./windowManager');

// Global storage for interview data
let interviewData = null;
let interviewResults = null;

function setupFileHandlers() {
    ipcMain.handle('upload-file', async (event, fileType) => {
        const mainWindow = getMainWindow();
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'txt', 'docx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileExtension = path.extname(filePath).toLowerCase();
            
            try {
                const type = fileType === 'cv' ? 'resume' : 'job_description';
                const content = await extractTextFromFile(filePath, type, 'electron');
                
                return {
                    success: true,
                    content: content,
                    fileName: path.basename(filePath)
                };
            } catch (error) {
                console.error('File extraction error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        
        return { success: false, error: 'No file selected' };
    });

    ipcMain.handle('extract-languages', async (event, jobDescription) => {
        try {
            const languages = extractProgrammingLanguages(jobDescription);
            const suggestions = Array.isArray(languages) ? languages : [];
            
            return {
                success: true,
                languages: suggestions
            };
        } catch (error) {
            console.error('Language extraction error:', error);
            return {
                success: false,
                error: error.message,
                languages: []
            };
        }
    });
}

function setupInterviewHandlers() {
    ipcMain.handle('start-interview', async (event, data) => {
        interviewData = data;
        return { success: true };
    });

    ipcMain.handle('get-interview-data', async () => {
        return interviewData;
    });

    ipcMain.handle('end-interview', async (event, results) => {
        interviewResults = results;
        return { success: true };
    });

    ipcMain.handle('get-interview-results', async () => {
        return interviewResults;
    });
}

function setupUtilityHandlers() {
    ipcMain.handle('ping', async () => {
        console.log('Ping received');
        return 'pong';
    });

    ipcMain.handle('test-handler', async () => {
        console.log('Test handler called');
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
}

function setupAllFileHandlers() {
    setupFileHandlers();
    setupInterviewHandlers();
    setupUtilityHandlers();
}

module.exports = {
    setupAllFileHandlers,
    setupFileHandlers,
    setupInterviewHandlers,
    setupUtilityHandlers
};