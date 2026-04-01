import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'New Conversation'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    aiProvider: {
        type: String,
        default: 'groq',
        enum: ['groq', 'gemini']
    },
    aiModel: {
        type: String,
        default: 'llama-3.3-70b-versatile'
    }
}, {
    timestamps: true
});

// Static method to create a new conversation
conversationSchema.statics.createConversation = async function(userId, title = 'New Conversation', aiProvider = 'groq', aiModel = null) {
    // Set default model based on provider if not provided
    if (!aiModel) {
        aiModel = aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.3-70b-versatile';
    }
    
    const conversation = await this.create({
        userId,
        title,
        aiProvider,
        aiModel,
        messageCount: 0,
        lastMessageAt: new Date()
    });
    return conversation;
};

// Static method to get user conversations with pagination
conversationSchema.statics.getUserConversations = async function(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const conversations = await this.find({ userId })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    return conversations;
};

// Instance method to update last message
conversationSchema.methods.updateLastMessage = async function(messageId) {
    this.lastMessageId = messageId;
    this.lastMessageAt = new Date();
    return await this.save();
};

// Instance method to increment message count
conversationSchema.methods.incrementMessageCount = async function() {
    this.messageCount += 1;
    return await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;