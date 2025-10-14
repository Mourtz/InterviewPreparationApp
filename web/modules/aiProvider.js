// AI Provider configuration and utilities for web version

const AI_PROVIDERS = {
    lmstudio: {
        name: 'LM Studio',
        baseUrl: 'http://127.0.0.1:1234',
        apiPath: '/v1/chat/completions',
        modelsPath: '/v1/models',
        requiresApiKey: false,
        defaultModel: null
    },
    ollama: {
        name: 'Ollama',
        baseUrl: 'http://127.0.0.1:11434',
        apiPath: '/api/chat',
        modelsPath: '/api/tags',
        requiresApiKey: false,
        defaultModel: 'llama2'
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

class AIProviderManager {
    constructor() {
        this.currentProvider = 'lmstudio';
        this.apiKey = null;
        this.availableModels = [];
        this.selectedModel = null;
        this.connectionStatus = false;
    }

    getProvider(providerId = this.currentProvider) {
        return AI_PROVIDERS[providerId];
    }

    getAllProviders() {
        return AI_PROVIDERS;
    }

    setProvider(providerId, apiKey = null) {
        if (!AI_PROVIDERS[providerId]) {
            throw new Error(`Unknown provider: ${providerId}`);
        }
        
        this.currentProvider = providerId;
        this.apiKey = apiKey;
        this.connectionStatus = false;
        this.availableModels = [];
        this.selectedModel = null;
    }

    getCurrentProvider() {
        return {
            id: this.currentProvider,
            config: this.getProvider(),
            apiKey: this.apiKey,
            connected: this.connectionStatus,
            models: this.availableModels,
            selectedModel: this.selectedModel
        };
    }

    async testConnection(providerId = this.currentProvider, apiKey = null) {
        const provider = this.getProvider(providerId);
        const testApiKey = apiKey || this.apiKey;
        
        try {
            const url = `${provider.baseUrl}${provider.modelsPath}`;
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (provider.requiresApiKey && testApiKey) {
                headers['Authorization'] = `Bearer ${testApiKey}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            let models = [];

            if (providerId === 'ollama') {
                models = data.models?.map(m => ({
                    id: m.name,
                    name: m.name,
                    size: m.size
                })) || [];
            } else {
                models = data.data?.map(m => ({
                    id: m.id,
                    name: m.id,
                    created: m.created
                })) || [];
            }

            return {
                success: true,
                models: models,
                provider: provider.name
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                models: [],
                provider: provider.name
            };
        }
    }

    async loadModels(providerId = this.currentProvider) {
        const result = await this.testConnection(providerId);
        
        if (result.success) {
            this.availableModels = result.models;
            this.connectionStatus = true;
            
            // Auto-select first model or default
            if (this.availableModels.length > 0) {
                const provider = this.getProvider(providerId);
                this.selectedModel = provider.defaultModel || this.availableModels[0].id;
            }
        } else {
            this.availableModels = [];
            this.connectionStatus = false;
            this.selectedModel = null;
        }
        
        return result;
    }

    setSelectedModel(modelId) {
        this.selectedModel = modelId;
    }

    buildRequestHeaders() {
        const provider = this.getProvider();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (provider.requiresApiKey && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        return headers;
    }

    buildRequestPayload(messages, model = null) {
        const provider = this.getProvider();
        const useModel = model || this.selectedModel || provider.defaultModel;
        
        if (this.currentProvider === 'ollama') {
            return {
                model: useModel,
                messages: messages,
                stream: false
            };
        } else {
            return {
                model: useModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
        }
    }

    parseResponse(response, providerId = this.currentProvider) {
        if (providerId === 'ollama') {
            return response.message?.content || '';
        } else {
            return response.choices?.[0]?.message?.content || '';
        }
    }

    async makeRequest(messages, model = null) {
        const provider = this.getProvider();
        const url = `${provider.baseUrl}${provider.apiPath}`;
        const headers = this.buildRequestHeaders();
        const payload = this.buildRequestPayload(messages, model);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(60000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseResponse(data);

        } catch (error) {
            console.error('AI request failed:', error);
            throw error;
        }
    }
}

module.exports = {
    AI_PROVIDERS,
    AIProviderManager
};