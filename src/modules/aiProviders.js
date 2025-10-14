const axios = require('axios');

// AI Provider Configuration
const AI_PROVIDERS = {
    lmstudio: {
        name: 'LM Studio',
        baseUrl: 'http://127.0.0.1:1234',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: false,
        defaultModel: null // Will be auto-detected
    },
    ollama: {
        name: 'Ollama',
        baseUrl: 'http://127.0.0.1:11434',
        apiPath: '/api/chat',
        modelsPath: '/api/tags',
        requiresApiKey: false,
        defaultModel: 'llama2' // Common default
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: true,
        defaultModel: 'gpt-3.5-turbo'
    }
};

// Global AI configuration
let currentAIProvider = 'lmstudio'; // Default provider
let aiApiKey = null; // For OpenAI

function getProviderConfig(providerId = currentAIProvider) {
    return AI_PROVIDERS[providerId] || AI_PROVIDERS.lmstudio;
}

function buildApiUrl(providerId, endpoint) {
    const config = getProviderConfig(providerId);
    return `${config.baseUrl}${endpoint}`;
}

function buildHeaders(providerId = currentAIProvider) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const config = getProviderConfig(providerId);
    if (config.requiresApiKey && aiApiKey) {
        headers['Authorization'] = `Bearer ${aiApiKey}`;
    }
    
    return headers;
}

function formatRequestForProvider(providerId, messages, model) {
    const config = getProviderConfig(providerId);
    
    if (providerId === 'ollama') {
        return {
            model: model || config.defaultModel,
            messages: messages,
            stream: false
        };
    } else {
        // OpenAI and LM Studio format
        return {
            model: model || config.defaultModel || 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        };
    }
}

function parseResponseFromProvider(providerId, response) {
    if (providerId === 'ollama') {
        return response.data.message?.content || '';
    } else {
        // OpenAI and LM Studio format
        return response.data.choices?.[0]?.message?.content || '';
    }
}

async function makeAIRequest(messages, model = null, providerId = currentAIProvider) {
    try {
        const config = getProviderConfig(providerId);
        const url = buildApiUrl(providerId, config.apiPath);
        const headers = buildHeaders(providerId);
        const data = formatRequestForProvider(providerId, messages, model);

        console.log(`Making AI request to ${config.name}:`, { url, data });

        const response = await axios.post(url, data, {
            headers,
            timeout: 60000
        });

        return parseResponseFromProvider(providerId, response);
    } catch (error) {
        console.error('AI request failed:', error.message);
        throw error;
    }
}

function setCurrentProvider(providerId, apiKey = null) {
    if (!AI_PROVIDERS[providerId]) {
        throw new Error(`Unknown AI provider: ${providerId}`);
    }
    
    currentAIProvider = providerId;
    aiApiKey = apiKey;
}

function getCurrentProvider() {
    return {
        id: currentAIProvider,
        config: getProviderConfig(),
        hasApiKey: !!aiApiKey
    };
}

async function testProviderConnection(providerId, apiKey = null) {
    const originalProvider = currentAIProvider;
    const originalApiKey = aiApiKey;

    try {
        // Temporarily set the provider for testing
        setCurrentProvider(providerId, apiKey);
        
        const config = getProviderConfig(providerId);
        const modelsUrl = buildApiUrl(providerId, config.modelsPath);
        const headers = buildHeaders(providerId);

        const response = await axios.get(modelsUrl, {
            headers,
            timeout: 10000
        });

        // Parse models based on provider
        let models = [];
        if (providerId === 'ollama') {
            models = response.data.models?.map(m => ({ id: m.name, name: m.name })) || [];
        } else {
            models = response.data.data?.map(m => ({ id: m.id, name: m.id })) || [];
        }

        return {
            success: true,
            models,
            provider: config.name
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            models: [],
            provider: getProviderConfig(providerId).name
        };
    } finally {
        // Restore original provider settings
        currentAIProvider = originalProvider;
        aiApiKey = originalApiKey;
    }
}

module.exports = {
    AI_PROVIDERS,
    getProviderConfig,
    buildApiUrl,
    buildHeaders,
    makeAIRequest,
    setCurrentProvider,
    getCurrentProvider,
    testProviderConnection,
    get currentAIProvider() { return currentAIProvider; },
    get aiApiKey() { return aiApiKey; }
};