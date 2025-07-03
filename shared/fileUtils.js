// shared/fileUtils.js
// Cross-environment file parsing utilities for Interview Preparation App

/**
 * Extract text from a file (PDF or TXT)
 * @param {File|Buffer|string} file - File object (web: File, Electron: path or Buffer)
 * @param {'pdf'|'txt'} type - File type
 * @param {'web'|'electron'} environment - Runtime environment
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(file, type, environment) {
    if (type === 'pdf') {
        if (environment === 'web') {
            // Web: use pdfjsLib
            return extractPdfTextWeb(file);
        } else {
            // Electron: use pdf-parse
            return extractPdfTextElectron(file);
        }
    } else if (type === 'txt') {
        if (environment === 'web') {
            return extractTxtTextWeb(file);
        } else {
            return extractTxtTextElectron(file);
        }
    } else {
        throw new Error('Unsupported file type');
    }
}

// --- Web implementations ---
async function extractPdfTextWeb(file) {
    // Assumes pdfjsLib is loaded globally
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const typedArray = new Uint8Array(event.target.result);
                const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    text += pageText + '\n';
                }
                resolve(text.trim());
            } catch (error) {
                reject(new Error('Failed to extract text from PDF'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
    });
}

async function extractTxtTextWeb(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

// --- Electron implementations ---
async function extractPdfTextElectron(file) {
    // file: Buffer or file path
    const pdfParse = require('pdf-parse');
    const fs = require('fs');
    let buffer;
    if (Buffer.isBuffer(file)) {
        buffer = file;
    } else {
        buffer = fs.readFileSync(file);
    }
    const data = await pdfParse(buffer);
    return data.text;
}

async function extractTxtTextElectron(file) {
    const fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}

module.exports = {
    extractTextFromFile
};
