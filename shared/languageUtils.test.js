// languageUtils.test.js - Unit tests for shared/languageUtils.js
const { extractProgrammingLanguages, getLanguageOptions, generateLanguageDropdownOptionObjects, languageMap } = require('./languageUtils');

describe('extractProgrammingLanguages', () => {
    it('detects single language', () => {
        expect(extractProgrammingLanguages('I love Python!')).toEqual(['python']);
    });
    it('detects multiple languages', () => {
        const text = 'Experience with JavaScript, C++, and Rust.';
        const langs = extractProgrammingLanguages(text);
        expect(langs.sort()).toEqual(['javascript', 'c++', 'rust'].sort());
    });
    it('is case-insensitive', () => {
        expect(extractProgrammingLanguages('JAVASCRIPT and PYTHON')).toEqual(['javascript', 'python']);
    });
    it('returns empty array if none found', () => {
        expect(extractProgrammingLanguages('No programming here.')).toEqual([]);
    });
});

describe('getLanguageOptions', () => {
    it('returns correct label/value pairs', () => {
        const opts = getLanguageOptions(['python', 'c++']);
        expect(opts).toEqual([
            { value: 'python', label: 'Python' },
            { value: 'c++', label: 'C++' }
        ]);
    });
    it('capitalizes unknown languages', () => {
        const opts = getLanguageOptions(['foobar']);
        expect(opts).toEqual([{ value: 'foobar', label: 'Foobar' }]);
    });
});

describe('generateLanguageDropdownOptionObjects', () => {
    it('generates dropdown options with header', () => {
        const opts = getLanguageOptions(['python', 'java']);
        const dropdown = generateLanguageDropdownOptionObjects(opts, 'Header');
        expect(dropdown[0]).toEqual({ value: '', label: 'Header', disabled: true, selected: true });
        expect(dropdown[1]).toMatchObject({ value: 'python', label: 'Python', selected: true });
        expect(dropdown[2]).toMatchObject({ value: 'java', label: 'Java', selected: false });
    });
    it('sets only first language as selected', () => {
        const opts = getLanguageOptions(['python', 'java', 'go']);
        const dropdown = generateLanguageDropdownOptionObjects(opts);
        expect(dropdown[1].selected).toBe(true);
        expect(dropdown[2].selected).toBe(false);
        expect(dropdown[3].selected).toBe(false);
    });
});
