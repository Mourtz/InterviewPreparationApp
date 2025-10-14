// Shared utility functions for language detection and handling

function extractProgrammingLanguages(text) {
    const languages = [
        { keywords: ['javascript', 'js', 'node.js', 'react', 'vue', 'angular'], name: 'JavaScript', value: 'javascript' },
        { keywords: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'], name: 'Python', value: 'python' },
        { keywords: ['java', 'spring', 'hibernate', 'maven', 'gradle'], name: 'Java', value: 'java' },
        { keywords: ['typescript', 'ts', 'angular', 'nest.js'], name: 'TypeScript', value: 'typescript' },
        { keywords: ['c#', 'csharp', '.net', 'asp.net', 'entity framework'], name: 'C#', value: 'csharp' },
        { keywords: ['c++', 'cpp', 'qt', 'boost'], name: 'C++', value: 'cpp' },
        { keywords: ['go', 'golang', 'gin', 'gorilla'], name: 'Go', value: 'go' },
        { keywords: ['rust', 'cargo', 'tokio'], name: 'Rust', value: 'rust' },
        { keywords: ['php', 'laravel', 'symfony', 'composer'], name: 'PHP', value: 'php' },
        { keywords: ['ruby', 'rails', 'sinatra'], name: 'Ruby', value: 'ruby' }
    ];
    
    const textLower = text.toLowerCase();
    return languages.filter(lang => 
        lang.keywords.some(keyword => textLower.includes(keyword))
    );
}

function getLanguageOptions(detectedLanguages) {
    return detectedLanguages.map(lang => ({
        value: lang.value,
        label: lang.name,
        detected: true
    }));
}

function generateLanguageDropdownOptions(options, groupLabel) {
    const optElements = [];
    
    if (groupLabel) {
        optElements.push(`<optgroup label="${groupLabel}">`);
    }
    
    options.forEach(option => {
        const selectedAttr = option.selected ? 'selected' : '';
        const detectedMark = option.detected ? ' (detected)' : '';
        optElements.push(
            `<option value="${option.value}" ${selectedAttr}>${option.label}${detectedMark}</option>`
        );
    });
    
    if (groupLabel) {
        optElements.push('</optgroup>');
    }
    
    return optElements.join('');
}

function getCodeMirrorMode(language) {
    const modeMap = {
        'javascript': 'javascript',
        'python': 'python',
        'java': 'text/x-java',
        'typescript': 'typescript',
        'csharp': 'text/x-csharp',
        'cpp': 'text/x-c++src',
        'go': 'text/x-go',
        'rust': 'text/x-rustsrc',
        'php': 'text/x-php',
        'ruby': 'text/x-ruby',
        'html': 'text/html',
        'css': 'text/css',
        'sql': 'text/x-sql',
        'json': 'application/json',
        'xml': 'text/xml',
        'yaml': 'text/x-yaml',
        'shell': 'text/x-sh',
        'powershell': 'text/x-powershell',
        'markdown': 'text/x-markdown'
    };
    
    return modeMap[language] || 'text/plain';
}

// Utility function used in copyProtection
function reverseString(str) {
    return str.split('').reverse().join('');
}

module.exports = {
    extractProgrammingLanguages,
    getLanguageOptions,
    generateLanguageDropdownOptions,
    getCodeMirrorMode,
    reverseString
};