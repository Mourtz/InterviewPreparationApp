const { ipcMain } = require('electron');
const axios = require('axios');
const { 
    AI_PROVIDERS, 
    setCurrentProvider, 
    getCurrentProvider, 
    testProviderConnection,
    makeAIRequest,
    getProviderConfig,
    buildApiUrl,
    buildHeaders
} = require('./aiProviders');

function setupAIProviderHandlers() {
    ipcMain.handle('get-ai-providers', async () => {
        const providers = Object.entries(AI_PROVIDERS).map(([id, config]) => ({
            id,
            name: config.name,
            requiresApiKey: config.requiresApiKey,
            isActive: getCurrentProvider().id === id
        }));
        
        return {
            success: true,
            providers,
            currentProvider: getCurrentProvider()
        };
    });

    ipcMain.handle('set-ai-provider', async (event, { providerId, apiKey = null }) => {
        try {
            setCurrentProvider(providerId, apiKey);
            
            return {
                success: true,
                currentProvider: getCurrentProvider()
            };
        } catch (error) {
            console.error('Set AI provider error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('test-ai-provider', async (event, { providerId, apiKey = null }) => {
        try {
            const result = await testProviderConnection(providerId, apiKey);
            return result;
        } catch (error) {
            console.error('Test AI provider error:', error);
            return {
                success: false,
                error: error.message,
                models: []
            };
        }
    });

    ipcMain.handle('get-available-models', async () => {
        try {
            const currentProvider = getCurrentProvider();
            const config = getProviderConfig();
            const modelsUrl = buildApiUrl(currentProvider.id, config.modelsPath);
            const headers = buildHeaders();

            console.log(`Fetching models from ${config.name}:`, modelsUrl);

            const response = await axios.get(modelsUrl, {
                headers,
                timeout: 10000
            });

            let models = [];
            if (currentProvider.id === 'ollama') {
                models = response.data.models?.map(model => ({
                    id: model.name,
                    name: model.name,
                    size: model.size,
                    modified_at: model.modified_at
                })) || [];
            } else {
                // OpenAI/LM Studio format
                models = response.data.data?.map(model => ({
                    id: model.id,
                    name: model.id,
                    created: model.created,
                    owned_by: model.owned_by
                })) || [];
            }

            console.log(`Found ${models.length} models:`, models.map(m => m.name));

            return {
                success: true,
                models,
                provider: config.name,
                total: models.length
            };

        } catch (error) {
            console.error('Get models error:', error);
            
            return {
                success: false,
                error: error.message,
                models: [],
                provider: getProviderConfig().name,
                total: 0
            };
        }
    });
}

function setupAIConnectionHandlers() {
    ipcMain.handle('check-ai-connection', async () => {
        try {
            const currentProvider = getCurrentProvider();
            const config = getProviderConfig();
            
            console.log(`Testing connection to ${config.name}...`);
            
            // Test with a simple completion request
            const testMessages = [{
                role: 'user',
                content: 'Hello, please respond with just "OK" to confirm you are working.'
            }];

            const response = await makeAIRequest(testMessages);
            
            console.log(`Connection test successful. Response: ${response.substring(0, 100)}...`);
            
            return {
                success: true,
                provider: config.name,
                response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('AI connection test failed:', error);
            
            return {
                success: false,
                error: error.message,
                provider: getProviderConfig().name,
                timestamp: new Date().toISOString(),
                details: {
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                }
            };
        }
    });

    ipcMain.handle('check-ai-connection-simple', async () => {
        try {
            const currentProvider = getCurrentProvider();
            const config = getProviderConfig();
            const baseUrl = config.baseUrl;
            
            console.log(`Simple connection test to ${config.name} at ${baseUrl}...`);
            
            // Just test if we can reach the server
            const response = await axios.get(baseUrl, {
                timeout: 5000,
                validateStatus: () => true // Accept any status code
            });

            const isReachable = response.status < 500;
            
            return {
                success: isReachable,
                provider: config.name,
                baseUrl: baseUrl,
                status: response.status,
                statusText: response.statusText,
                reachable: isReachable,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Simple connection test failed:', error);
            
            return {
                success: false,
                provider: getProviderConfig().name,
                baseUrl: getProviderConfig().baseUrl,
                error: error.message,
                reachable: false,
                timestamp: new Date().toISOString()
            };
        }
    });

    ipcMain.handle('check-ai-simple-http', async () => {
        try {
            const config = getProviderConfig();
            const testUrl = config.baseUrl;
            
            console.log(`HTTP test to ${testUrl}...`);
            
            const response = await axios.get(testUrl, {
                timeout: 3000,
                validateStatus: () => true,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'InterviewApp/1.0'
                }
            });

            return {
                success: true,
                url: testUrl,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                hasData: !!response.data,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                url: getProviderConfig().baseUrl,
                error: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
            };
        }
    });
}

function setupAllAIHandlers() {
    setupAIProviderHandlers();
    setupAIConnectionHandlers();
}

module.exports = {
    setupAllAIHandlers,
    setupAIProviderHandlers,
    setupAIConnectionHandlers
};