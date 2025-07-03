const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for OpenAI API calls
app.use(cors());

// Serve static files from the web directory
app.use(express.static(path.join(__dirname)));

// Handle SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎯 Interview Preparation App - Web Version`);
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`📖 Open your browser and navigate to the URL above`);
    console.log(`🔑 Make sure you have your OpenAI API key ready`);
});

module.exports = app;
