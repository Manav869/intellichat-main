import { Server } from 'socket.io';
import { streamMessage } from '../services/aiService.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import Conversation from '../models/conversation.models.js';
import { Message } from '../models/message.models.js';
import { generateTitleFromMessage } from '../utils/titleUtils.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost:5174", // Allow alternate port
                "http://localhost:5173"
            ],
            credentials: true,
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            // Try to get token from auth or cookies
            let token = socket.handshake.auth.token;
            
            if (!token) {
                const cookies = socket.handshake.headers.cookie;
                if (cookies) {
                    const accessTokenCookie = cookies.split(';').find(c => c.trim().startsWith('accessToken='));
                    if (accessTokenCookie) {
                        token = accessTokenCookie.split('=')[1];
                    }
                }
            }
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select('-password -refreshTokenHash');
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = decoded._id;
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId} (${socket.user.email}) [Socket ID: ${socket.id}]`);
        console.log(`📊 Total active connections for this user: ${getActiveConnectionsForUser(socket.userId)}`);

        // Handle chat message with streaming
        socket.on('chat:message', async (data) => {
            const startTime = Date.now();
            console.log(`📨 Received message from ${socket.user.email}`);
            
            try {
                const { messages, provider, model, temperature, maxTokens, messageId, conversationId, userMessageContent } = data;

                // Validate input
                if (!messages || !Array.isArray(messages)) {
                    socket.emit('chat:error', { 
                        messageId,
                        error: 'Invalid messages format' 
                    });
                    return;
                }

                if (!messageId) {
                    socket.emit('chat:error', { 
                        error: 'Message ID is required' 
                    });
                    return;
                }

                if (!conversationId) {
                    socket.emit('chat:error', { 
                        messageId,
                        error: 'Conversation ID is required' 
                    });
                    return;
                }

                // Find the conversation
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    userId: socket.userId
                });

                if (!conversation) {
                    socket.emit('chat:error', { 
                        messageId,
                        error: 'Conversation not found' 
                    });
                    return;
                }

                console.log('═══════════════════════════════════════════════════');
                console.log('📨 NEW MESSAGE REQUEST');
                console.log('═══════════════════════════════════════════════════');
                console.log('📝 Conversation ID:', conversationId);
                console.log('📝 Conversation Title:', conversation.title);
                console.log('📝 DB - aiProvider:', conversation.aiProvider);
                console.log('📝 DB - aiModel:', conversation.aiModel);
                console.log('📝 Request - provider:', data.provider || 'not provided');
                console.log('📝 Request - model:', data.model || 'not provided');
                console.log('═══════════════════════════════════════════════════');

                // ALWAYS use conversation's provider and model (which were set correctly on creation)
                // This ensures consistency and uses the user's preference at the time of creation
                const aiProvider = conversation.aiProvider || 'groq';
                const aiModel = conversation.aiModel || 
                    (conversation.aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.3-70b-versatile');

                console.log('🤖 FINAL SELECTION:');
                console.log('   Provider:', aiProvider);
                console.log('   Model:', aiModel);
                console.log('═══════════════════════════════════════════════════');

                // Save user message to database
                const userMessage = await Message.create({
                    conversationId,
                    role: 'user',
                    content: userMessageContent || messages[messages.length - 1].content,
                    userId: socket.userId,
                    aiProvider: aiProvider
                });

                console.log('💾 User message saved:', userMessage._id);

                // If this is the first message, update conversation title
                if (conversation.messageCount === 0) {
                    const title = generateTitleFromMessage(userMessageContent || messages[messages.length - 1].content);
                    conversation.title = title;
                    await conversation.save();
                    console.log(`📝 Updated conversation title to: "${title}"`);
                    
                    // Emit title update to client
                    socket.emit('conversation:title-updated', {
                        conversationId,
                        title
                    });
                }

                // Update conversation message count
                await conversation.incrementMessageCount();

                // Emit start event
                socket.emit('chat:start', { 
                    messageId,
                    timestamp: new Date().toISOString(),
                    userMessageId: userMessage._id
                });

                let fullResponse = '';
                let chunkCount = 0;

                // Stream the response
                const stream = streamMessage(
                    aiProvider,
                    messages,
                    {
                        model: aiModel,
                        temperature: temperature || 0.7,
                        maxTokens: maxTokens || 1000
                    }
                );

                // Send each chunk as it arrives
                for await (const chunk of stream) {
                    fullResponse += chunk.content;
                    chunkCount++;
                    
                    socket.emit('chat:chunk', {
                        messageId,
                        content: chunk.content,
                        model: chunk.model,
                        provider: chunk.provider,
                        chunkIndex: chunkCount
                    });
                }

                const duration = Date.now() - startTime;
                console.log(`✅ Completed streaming: ${chunkCount} chunks in ${duration}ms`);

                // Save AI message to database
                const aiMessage = await Message.create({
                    conversationId,
                    role: 'assistant',
                    content: fullResponse,
                    userId: socket.userId,
                    aiProvider: aiProvider
                });

                console.log('💾 AI message saved:', aiMessage._id);

                // Update conversation with last message
                await conversation.updateLastMessage(aiMessage._id);
                await conversation.incrementMessageCount();

                // Emit completion event with saved message IDs
                socket.emit('chat:complete', {
                    messageId,
                    fullContent: fullResponse,
                    timestamp: new Date().toISOString(),
                    chunkCount,
                    duration,
                    aiMessageId: aiMessage._id,
                    userMessageId: userMessage._id
                });

            } catch (error) {
                console.error('❌ Socket chat error:', error);
                socket.emit('chat:error', {
                    messageId: data.messageId,
                    error: error.message || 'Failed to process message'
                });
            }
        });

        // Handle stop generation
        socket.on('chat:stop', (data) => {
            console.log(`⏹️ Stop generation requested: ${data.messageId}`);
            // You can implement actual stream cancellation here if needed
            socket.emit('chat:stopped', { messageId: data.messageId });
        });

        // Handle typing indicators (optional)
        socket.on('typing:start', () => {
            socket.broadcast.emit('user:typing', { 
                userId: socket.userId,
                email: socket.user.email 
            });
        });

        socket.on('typing:stop', () => {
            socket.broadcast.emit('user:stopped-typing', { 
                userId: socket.userId 
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${socket.userId} (${socket.user.email}) [Socket ID: ${socket.id}]`);
            console.log(`   Reason: ${reason}`);
            console.log(`📊 Remaining connections for this user: ${getActiveConnectionsForUser(socket.userId)}`);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    console.log('🚀 Socket.IO initialized successfully');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Helper function to count active connections for a user
const getActiveConnectionsForUser = (userId) => {
    if (!io) return 0;
    const sockets = Array.from(io.sockets.sockets.values());
    return sockets.filter(socket => socket.userId === userId).length;
};

export const emitToUser = (userId, event, data) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }
    
    const sockets = Array.from(io.sockets.sockets.values());
    const userSocket = sockets.find(socket => socket.userId === userId);
    
    if (userSocket) {
        userSocket.emit(event, data);
    }
};