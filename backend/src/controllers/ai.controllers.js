import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { processMessage, streamMessage, getAvailableModels } from "../services/aiService.js";

/**
 * Send a message to AI and get response
 */
const sendAIMessage = asyncHandler(async (req, res) => {
    const { provider, messages, options = {} } = req.body;
    const userId = req.user._id;

    // Validation
    if (!provider) {
        throw new ApiError("AI provider is required", 400);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ApiError("Messages array is required", 400);
    }

    // Validate message format
    for (const message of messages) {
        if (!message.role || !message.content) {
            throw new ApiError("Each message must have 'role' and 'content'", 400);
        }
        if (!['system', 'user', 'assistant'].includes(message.role)) {
            throw new ApiError("Message role must be 'system', 'user', or 'assistant'", 400);
        }
    }

    try {
        console.log(`Processing AI message with ${provider} for user ${userId}`);
        
        const response = await processMessage(provider, messages, options);
        
        console.log(`AI response generated successfully for user ${userId}`);
        
        res.status(200).json({
            success: true,
            message: "AI response generated successfully",
            data: response
        });
    } catch (error) {
        console.error(`AI processing error for user ${userId}:`, error.message);
        throw new ApiError(`AI processing failed: ${error.message}`, 500);
    }
});

/**
 * Get AI response as complete JSON (non-streaming)
 */
const getAIResponse = asyncHandler(async (req, res) => {
    const { provider, messages, options = {} } = req.body;
    const userId = req.user._id;

    // Validation
    if (!provider) {
        throw new ApiError("AI provider is required", 400);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ApiError("Messages array is required", 400);
    }

    try {
        console.log(`Getting AI response with ${provider} for user ${userId}`);
        
        const response = await processMessage(provider, messages, options);
        
        res.status(200).json({
            success: true,
            message: "AI response generated successfully",
            data: response
        });
    } catch (error) {
        console.error(`AI processing error for user ${userId}:`, error.message);
        throw new ApiError(`AI processing failed: ${error.message}`, 500);
    }
});

/**
 * Stream AI response
 * Supports both SSE and JSON streaming formats
 */
const streamAIMessage = asyncHandler(async (req, res) => {
    const { provider, messages, options = {} } = req.body;
    const { format = 'sse' } = req.query; // 'sse' or 'json'
    const userId = req.user._id;

    // Validation
    if (!provider) {
        throw new ApiError("AI provider is required", 400);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ApiError("Messages array is required", 400);
    }

    // Set up response headers based on format
    if (format === 'sse') {
        // Server-Sent Events format
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    } else {
        // JSON streaming format
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    }

    try {
        console.log(`Streaming AI message with ${provider} for user ${userId} (format: ${format})`);
        
        const stream = streamMessage(provider, messages, options);
        
        for await (const chunk of stream) {
            if (format === 'sse') {
                // Server-Sent Events format
                const data = JSON.stringify(chunk);
                res.write(`data: ${data}\n\n`);
            } else {
                // JSON streaming format (one JSON object per line)
                res.write(JSON.stringify(chunk) + '\n');
            }
        }
        
        // Send completion signal
        if (format === 'sse') {
            res.write(`data: ${JSON.stringify({ type: 'end', message: 'Stream completed' })}\n\n`);
        } else {
            res.write(JSON.stringify({ type: 'end', message: 'Stream completed' }) + '\n');
        }
        
        res.end();
        console.log(`AI streaming completed for user ${userId}`);
    } catch (error) {
        console.error(`AI streaming error for user ${userId}:`, error.message);
        if (format === 'sse') {
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        } else {
            res.write(JSON.stringify({ type: 'error', error: error.message }) + '\n');
        }
        res.end();
    }
});

/**
 * Get available AI providers and models
 */
const getAIProviders = asyncHandler(async (req, res) => {
    try {
        const providers = {
            groq: {
                name: "Groq",
                models: getAvailableModels("groq"),
                description: "Fast AI inference with Llama models"
            },
            gemini: {
                name: "Google Gemini",
                models: getAvailableModels("gemini"),
                description: "Google's advanced AI model"
            }
        };

        res.status(200).json({
            success: true,
            message: "AI providers retrieved successfully",
            data: providers
        });
    } catch (error) {
        console.error("Error getting AI providers:", error.message);
        throw new ApiError("Failed to get AI providers", 500);
    }
});

/**
 * Test AI provider connection
 */
const testAIProvider = asyncHandler(async (req, res) => {
    const { provider } = req.body;
    const userId = req.user._id;

    if (!provider) {
        throw new ApiError("AI provider is required", 400);
    }

    try {
        console.log(`Testing ${provider} connection for user ${userId}`);
        
        const testMessages = [
            { role: "user", content: "Hello! Please respond with 'Connection successful' to test the AI provider." }
        ];

        const response = await processMessage(provider, testMessages, {
            temperature: 0.1,
            maxTokens: 50
        });

        res.status(200).json({
            success: true,
            message: `${provider} connection test successful`,
            data: {
                provider: response.provider,
                model: response.model,
                testResponse: response.content
            }
        });
    } catch (error) {
        console.error(`${provider} connection test failed for user ${userId}:`, error.message);
        throw new ApiError(`${provider} connection test failed: ${error.message}`, 500);
    }
});

export {
    sendAIMessage,
    getAIResponse,
    streamAIMessage,
    getAIProviders,
    testAIProvider
};
