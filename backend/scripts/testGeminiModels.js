import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiModels() {
    try {
        console.log('🔑 Testing Gemini API Key...\n');
        
        if (!GEMINI_API_KEY) {
            console.log('❌ GEMINI_API_KEY not found in .env file');
            return;
        }

        console.log('API Key:', GEMINI_API_KEY.substring(0, 10) + '...\n');

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Test different model names that might work
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-flash-8b',
            'models/gemini-pro'
        ];

        console.log('Testing models...\n');

        for (const modelName of modelsToTest) {
            try {
                console.log(`🧪 Testing: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent('Say "Hello" in one word');
                const response = await result.response;
                const text = response.text();
                
                console.log(`   ✅ SUCCESS: "${text.trim()}"`);
                console.log(`   👉 Use this model: ${modelName}\n`);
            } catch (error) {
                console.log(`   ❌ FAILED: ${error.message.substring(0, 100)}...\n`);
            }
        }

        // Try to list all available models
        console.log('\n📋 Attempting to list all available models...\n');
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
            );
            const data = await response.json();
            
            if (data.models) {
                console.log('✅ Available models:');
                data.models.forEach(model => {
                    if (model.supportedGenerationMethods?.includes('generateContent')) {
                        console.log(`   - ${model.name} (${model.displayName})`);
                    }
                });
            } else {
                console.log('❌ Could not list models:', data);
            }
        } catch (error) {
            console.log('❌ Error listing models:', error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testGeminiModels();
