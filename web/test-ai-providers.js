// Test script for AI providers connectivity
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

async function testProvider(providerId) {
    const config = AI_PROVIDERS[providerId];
    console.log(`\n🧪 Testing ${config.name}...`);
    
    try {
        const response = await fetch(`${config.baseUrl}${config.modelsPath}`, {
            signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
            const data = await response.json();
            let modelCount = 0;
            
            if (providerId === 'ollama') {
                modelCount = data.models?.length || 0;
            } else if (providerId === 'lmstudio') {
                modelCount = data.data?.length || 0;
            } else if (providerId === 'openai') {
                modelCount = data.data?.length || 0;
            }
            
            console.log(`✅ ${config.name}: Connected (${modelCount} models available)`);
            return true;
        } else {
            console.log(`❌ ${config.name}: Server error ${response.status}`);
            return false;
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.log(`⏰ ${config.name}: Connection timeout`);
        } else if (error.message.includes('fetch')) {
            console.log(`📡 ${config.name}: Server not reachable`);
        } else {
            console.log(`❌ ${config.name}: ${error.message}`);
        }
        return false;
    }
}

async function testAllProviders() {
    console.log('🎯 Testing AI Provider Connectivity');
    console.log('=====================================');
    
    const results = {};
    for (const providerId of ['lmstudio', 'ollama', 'openai']) {
        results[providerId] = await testProvider(providerId);
    }
    
    console.log('\n📊 Results Summary:');
    console.log('===================');
    for (const [provider, isConnected] of Object.entries(results)) {
        const status = isConnected ? '✅ Connected' : '❌ Not available';
        console.log(`${AI_PROVIDERS[provider].name}: ${status}`);
    }
    
    const availableCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 ${availableCount}/3 providers available`);
    
    if (availableCount === 0) {
        console.log('\n⚠️  No AI providers detected. The app will work in fallback mode.');
    } else {
        console.log('\n🚀 Ready for AI-powered interviews!');
    }
}

// Run the test
testAllProviders().catch(console.error);
