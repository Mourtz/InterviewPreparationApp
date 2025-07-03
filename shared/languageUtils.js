// Utility for extracting programming languages from text and generating dropdown options
const languageMap = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'c#': 'C#',
    'csharp': 'C#',
    'cpp': 'C++',
    'c++': 'C++',
    'go': 'Go',
    'rust': 'Rust',
    'php': 'PHP',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'sql': 'SQL'
};

function extractProgrammingLanguages(text) {
    const detected = new Set();
    const textLower = text.toLowerCase();
    for (const [key, label] of Object.entries(languageMap)) {
        if (textLower.includes(key)) {
            detected.add(key);
        }
    }
    return Array.from(detected);
}

function getLanguageOptions(languages) {
    return languages.map(lang => ({
        value: lang,
        label: languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
    }));
}

/**
 * Generate <option> elements for a language dropdown (for web usage)
 * @param {Array} options - Array of {value, label}
 * @param {string} headerText - Header for the dropdown
 * @returns {Array} Array of HTMLOptionElement
 */
function generateLanguageDropdownOptions(options, headerText = 'Select a language:') {
    const opts = [];
    const headerOption = document.createElement('option');
    headerOption.value = '';
    headerOption.disabled = true;
    headerOption.selected = true;
    headerOption.textContent = headerText;
    opts.push(headerOption);
    options.forEach((opt, index) => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (index === 0) {
            option.selected = true;
            headerOption.selected = false;
        }
        opts.push(option);
    });
    return opts;
}

/**
 * Generate dropdown option objects for Electron (for renderer process)
 * @param {Array} options - Array of {value, label}
 * @param {string} headerText - Header for the dropdown
 * @returns {Array} Array of plain objects {value, label, disabled, selected}
 */
function generateLanguageDropdownOptionObjects(options, headerText = 'Select a language:') {
    const opts = [{ value: '', label: headerText, disabled: true, selected: true }];
    options.forEach((opt, index) => {
        opts.push({
            value: opt.value,
            label: opt.label,
            disabled: false,
            selected: index === 0
        });
        if (index === 0) opts[0].selected = false;
    });
    return opts;
}

module.exports = {
    extractProgrammingLanguages,
    getLanguageOptions,
    languageMap,
    generateLanguageDropdownOptions,
    generateLanguageDropdownOptionObjects
};
