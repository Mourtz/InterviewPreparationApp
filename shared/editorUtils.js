// Utility for mapping programming languages to CodeMirror modes
const modeMap = {
    'javascript': 'javascript',
    'typescript': 'javascript',
    'python': 'python',
    'java': 'text/x-java',
    'cpp': 'text/x-c++src',
    'csharp': 'text/x-csharp',
    'c#': 'text/x-csharp',
    'go': 'go',
    'rust': 'rust',
    'php': 'php',
    'ruby': 'ruby',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'scala': 'scala',
    'sql': 'sql'
};

function getCodeMirrorMode(language) {
    return modeMap[language] || 'text';
}

module.exports = { getCodeMirrorMode, modeMap };
