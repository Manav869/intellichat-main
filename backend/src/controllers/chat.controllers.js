import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { processMessage } from "../services/aiService.js";
import Conversation from "../models/conversation.models.js";
import { Message } from "../models/message.models.js";
import { generateTitleFromMessage } from '../utils/titleUtils.js';

/**
 * Create a new conversation
 */
const createConversation = asyncHandler(async (req, res) => {
    const { title, aiProvider } = req.body;
    const userId = req.user._id;

    console.log('🆕 Creating new conversation:');
    console.log('   User preferences:', req.user.preferences);
    console.log('   Requested provider:', aiProvider);

    // Use user's preferred provider if not specified
    const selectedProvider = aiProvider || req.user.preferences?.aiProvider || 'groq';
    
    // Use user's preferred model for the selected provider
    // Default to gemini-2.5-flash (Gemini 2.5) for Gemini provider — matches available models for current API key
    const selectedModel = req.user.preferences?.aiModel || 
        (selectedProvider === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.3-70b-versatile');

    console.log('   ✅ Selected:', selectedProvider, '/', selectedModel);

    // Validate input
    if (!['groq', 'gemini'].includes(selectedProvider)) {
        throw new ApiError("Invalid AI provider. Must be 'groq' or 'gemini'", 400);
    }

    try {
        const conversation = await Conversation.createConversation(userId, title, selectedProvider, selectedModel);
        
        console.log('   💾 Saved conversation:', conversation._id, '-', conversation.aiProvider, '/', conversation.aiModel);
        
        res.status(201).json({
            success: true,
            message: "Conversation created successfully",
            data: conversation
        });
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw new ApiError("Failed to create conversation", 500);
    }
});

/**
 * Get all conversations for a user
 */
const getUserConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    try {
        const conversations = await Conversation.getUserConversations(userId, page, limit);
        const total = await Conversation.countDocuments({ userId });

        res.status(200).json({
            success: true,
            message: "Conversations retrieved successfully",
            data: {
                conversations,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error("Error getting conversations:", error);
        throw new ApiError("Failed to retrieve conversations", 500);
    }
});

/**
 * Get a specific conversation with messages
 */
const getConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findOne({
        _id: conversationId,
        userId
    });

    if (!conversation) {
        throw new ApiError("Conversation not found", 404);
    }

    // Fetch messages separately
    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 });

    res.status(200).json({
        success: true,
        message: "Conversation retrieved successfully",
        data: {
            conversation,
            messages
        }
    });
});

/**
 * Send a message in a conversation
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content, aiProvider } = req.body;
    const userId = req.user._id;

    // Find conversation
    const conversation = await Conversation.findOne({
        _id: conversationId,
        userId
    });

    if (!conversation) {
        throw new ApiError("Conversation not found", 404);
    }

    // Get conversation history
    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .select('role content');

    // Add user message
    const userMessage = await Message.create({
        conversationId,
        role: 'user',
        content,
        userId,
        aiProvider: aiProvider || conversation.aiProvider
    });

    // If this is the first message, update conversation title
    if (conversation.messageCount === 0) {
        const title = generateTitleFromMessage(content);
        conversation.title = title;
        await conversation.save();
    }

    // Prepare messages for AI
    const aiMessages = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content }
    ];

    try {
        // Get AI response
        const aiResponse = await processMessage(
            aiProvider || conversation.aiProvider,
            aiMessages,
            { temperature: 0.7, maxTokens: 1000 }
        );

    // Save AI message
    const aiMessage = await Message.create({
        conversationId,
        role: 'assistant',
        content: aiResponse.content,
        userId,
        aiProvider: aiProvider || conversation.aiProvider
    });

        // Update conversation using instance methods
        await conversation.updateLastMessage(aiMessage._id);
        await conversation.incrementMessageCount();

        res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: {
                userMessage,
                aiMessage,
                conversation: conversation
            }
        });
    } catch (error) {
        console.error("AI processing error:", error);
        throw new ApiError(`AI processing failed: ${error.message}`, 500);
    }
});

/**
 * Delete a conversation
 */
const deleteConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOneAndDelete({
        _id: conversationId,
        userId
    });

    if (!conversation) {
        throw new ApiError("Conversation not found", 404);
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    res.status(200).json({
        success: true,
        message: "Conversation deleted successfully"
    });
});

export {
    createConversation,
    getUserConversations,
    getConversation,
    sendMessage,
    deleteConversation
};
