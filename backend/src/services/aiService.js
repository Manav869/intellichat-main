import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */
class AIProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("API key is required for AI provider");
    }
    this.apiKey = apiKey;
  }

  /**
   * Send a message and get a response
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} AI response
   */
  async sendMessage(messages, options = {}) {
    throw new Error("sendMessage method must be implemented by provider");
  }

  /**
   * Stream a message response
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {AsyncGenerator} Streaming response
   */
  async *streamMessage(messages, options = {}) {
    throw new Error("streamMessage method must be implemented by provider");
  }

  /**
   * Get available models for this provider
   * @returns {Array} List of available models
   */
  getAvailableModels() {
    throw new Error("getAvailableModels method must be implemented by provider");
  }
}

/**
 * Groq AI Provider
 * Implements AIProvider interface for Groq API
 */
class GroqProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.client = new Groq({ apiKey: this.apiKey });
    // Updated to match actual Groq API production models as of Oct 2025
    this.availableModels = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "gemma2-9b-it",
      "mixtral-8x7b-32768"
    ];
  }

  async sendMessage(messages, options = {}) {
    try {
      const {
        model = "llama-3.1-8b-instant",
        temperature = 0.7,
        maxTokens = 1000,
        stream = false
      } = options;

      const chatCompletion = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream
      });

      return {
        success: true,
        content: chatCompletion.choices[0].message.content,
        model: model,
        usage: chatCompletion.usage,
        provider: "groq"
      };
    } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error(`Groq API Error: ${error.message}`);
    }
  }

  async *streamMessage(messages, options = {}) {
    try {
      const {
        model = "llama-3.3-70b-versatile",
        temperature = 0.7,
        maxTokens = 1000
      } = options;

      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield {
            content: chunk.choices[0].delta.content,
            model: model,
            provider: "groq"
          };
        }
      }
    } catch (error) {
      console.error("Groq Streaming Error:", error);
      throw new Error(`Groq Streaming Error: ${error.message}`);
    }
  }

  getAvailableModels() {
    return this.availableModels;
  }
}

/**
 * Gemini AI Provider
 * Implements AIProvider interface for Google Gemini API
 */
class GeminiProvider extends AIProvider {
    constructor() {
        super('gemini');
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.availableModels = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-flash-latest'
        ];
    }  async sendMessage(messages, options = {}) {
    try {
      const {
        model = "gemini-2.5-flash",
        temperature = 0.7,
        maxTokens = 1000
      } = options;

      // Convert messages to Gemini format
      const lastMessage = messages[messages.length - 1];
      const prompt = this.formatMessagesForGemini(messages);

      // Ensure the model name includes the 'models/' prefix for Gemini API
      const fullModelName = model.startsWith('models/') ? model : `models/${model}`;

      const genAI = this.genAI.getGenerativeModel({ 
        model: fullModelName,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens
        }
      });

      const result = await genAI.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
        model: model,
        provider: "gemini"
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  async *streamMessage(messages, options = {}) {
    try {
      const {
        model = "gemini-2.5-flash",
        temperature = 0.7,
        maxTokens = 1000
      } = options;

      const prompt = this.formatMessagesForGemini(messages);
      
      // Ensure the model name includes the 'models/' prefix for Gemini API
      const fullModelName = model.startsWith('models/') ? model : `models/${model}`;
      
      const genAI = this.genAI.getGenerativeModel({ 
        model: fullModelName,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens
        }
      });

      const result = await genAI.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            content: chunkText,
            model: model,
            provider: "gemini"
          };
        }
      }
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      throw new Error(`Gemini Streaming Error: ${error.message}`);
    }
  }

  formatMessagesForGemini(messages) {
    // Convert OpenAI format to Gemini format
    let prompt = "";
    for (const message of messages) {
      if (message.role === "system") {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === "user") {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }
    return prompt.trim();
  }

  getAvailableModels() {
    return this.availableModels;
  }
}

/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */
class AIProviderFactory {
  constructor() {
    this.providers = new Map();
  }

  /**
   * Get a provider instance
   * @param {string} providerName - Name of the provider (groq, gemini)
   * @param {string} apiKey - API key for the provider
   * @returns {AIProvider} Provider instance
   */
  getProvider(providerName, apiKey) {
    const key = `${providerName}_${apiKey}`;
    
    if (this.providers.has(key)) {
      return this.providers.get(key);
    }

    let provider;
    switch (providerName.toLowerCase()) {
      case "groq":
        provider = new GroqProvider(apiKey);
        break;
      case "gemini":
        provider = new GeminiProvider(apiKey);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }

    this.providers.set(key, provider);
    return provider;
  }

  /**
   * Get all available providers
   * @returns {Array} List of available provider names
   */
  getAvailableProviders() {
    return ["groq", "gemini"];
  }
}

/**
 * Process a message using the specified AI provider
 * @param {string} providerName - Name of the AI provider
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} AI response
 */
async function processMessage(providerName, messages, options = {}) {
  try {
    const apiKey = getApiKeyForProvider(providerName);
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${providerName}`);
    }

    const factory = new AIProviderFactory();
    const provider = factory.getProvider(providerName, apiKey);
    
    return await provider.sendMessage(messages, options);
  } catch (error) {
    console.error(`Error processing message with ${providerName}:`, error);
    throw error;
  }
}

/**
 * Stream a message using the specified AI provider
 * @param {string} providerName - Name of the AI provider
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Additional options
 * @returns {AsyncGenerator} Streaming response
 */
async function* streamMessage(providerName, messages, options = {}) {
  try {
    const apiKey = getApiKeyForProvider(providerName);
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${providerName}`);
    }

    const factory = new AIProviderFactory();
    const provider = factory.getProvider(providerName, apiKey);
    
    yield* provider.streamMessage(messages, options);
  } catch (error) {
    console.error(`Error streaming message with ${providerName}:`, error);
    throw error;
  }
}

/**
 * Get API key for a specific provider
 * @param {string} providerName - Name of the provider
 * @returns {string} API key
 */
function getApiKeyForProvider(providerName) {
  switch (providerName.toLowerCase()) {
    case "groq":
      return process.env.GROQ_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY;
    default:
      return null;
  }
}

/**
 * Get available models for a provider
 * @param {string} providerName - Name of the provider
 * @returns {Array} List of available models
 */
function getAvailableModels(providerName) {
  try {
    const apiKey = getApiKeyForProvider(providerName);
    if (!apiKey) {
      return [];
    }

    const factory = new AIProviderFactory();
    const provider = factory.getProvider(providerName, apiKey);
    return provider.getAvailableModels();
  } catch (error) {
    console.error(`Error getting models for ${providerName}:`, error);
    return [];
  }
}

export {
  AIProvider,
  GroqProvider,
  GeminiProvider,
  AIProviderFactory,
  processMessage,
  streamMessage,
  getAvailableModels
};
