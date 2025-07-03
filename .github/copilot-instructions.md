# Copilot Instructions for Interview Preparation App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an Electron-based desktop application for conducting AI-powered mock technical interviews. The app integrates with LM Studio for local AI processing and provides a comprehensive interview simulation experience.

## Key Technologies
- **Electron**: Desktop application framework
- **CodeMirror**: Text/code editor components
- **PDF-Parse**: For parsing PDF documents (CVs and job descriptions)
- **LM Studio Integration**: Local AI model hosting for question generation and evaluation
- **Vanilla JavaScript**: Frontend functionality without additional frameworks

## Architecture
- `src/main.js`: Main Electron process handling file operations, AI communication, and window management
- `renderer/`: Frontend files (HTML, CSS, JavaScript) for the user interface
- `renderer/index.html`: Main setup interface for uploading documents and configuring interview
- `renderer/interview.html`: Interview session interface with timer, questions, and answer input
- `renderer/styles.css`: Comprehensive styling for both light and dark themes
- `renderer/renderer.js`: Main window logic for file handling and interview setup
- `renderer/interview.js`: Interview session logic with timer, question navigation, and evaluation

## Key Features
1. **Document Upload**: PDF and text file support for CVs and job descriptions
2. **AI Integration**: LM Studio API integration with fallback mechanisms
3. **Interview Timer**: Configurable duration with visual countdown
4. **Code/Text Editor**: CodeMirror-based editor with syntax highlighting
5. **Real-time Evaluation**: AI-powered performance assessment
6. **Results Export**: JSON export of interview results and feedback

## AI Integration
- Primary: LM Studio API at `127.0.0.1:1234`
- Fallback: Static questions and manual evaluation prompts
- Model-agnostic: Works with any model loaded in LM Studio

## UI/UX Principles
- **Responsive Design**: Works on various screen sizes
- **Dark/Light Theme**: Interview interface uses dark theme for focus
- **Accessibility**: Keyboard shortcuts and screen reader friendly
- **Professional Appearance**: Modern gradient designs with clean typography

## Code Patterns
- Use async/await for all IPC communication
- Implement proper error handling with user-friendly notifications
- Modular JavaScript with clear separation of concerns
- CSS Grid and Flexbox for responsive layouts
- Progressive enhancement for optional features (TTS, AI evaluation)

## Testing Considerations
- Test with and without LM Studio running
- Verify PDF parsing with various document formats
- Ensure timer accuracy and interview state management
- Test file upload with different file types and sizes

## Development Notes
- Keep AI prompts configurable and well-documented
- Implement graceful degradation when AI services are unavailable
- Use semantic HTML and proper ARIA labels for accessibility
- Follow Electron security best practices for file handling
