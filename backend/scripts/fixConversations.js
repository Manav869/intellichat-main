// Script to fix old conversations with mismatched provider/model
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const conversationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title: String,
    aiProvider: String,
    aiModel: String,
    messageCount: Number,
    lastMessageAt: Date,
    lastMessageId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

async function fixConversations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all conversations
        const conversations = await Conversation.find({});
        console.log(`📊 Found ${conversations.length} conversations`);

        let fixedCount = 0;

        for (const conv of conversations) {
            let needsUpdate = false;
            const updates = {};

            // If aiModel is missing or doesn't match provider
            if (!conv.aiModel) {
                needsUpdate = true;
                // Set default model based on provider
                if (conv.aiProvider === 'gemini') {
                    updates.aiModel = 'gemini-2.5-flash';
                    console.log(`  Fixing conversation ${conv._id}: Setting model to gemini-2.5-flash`);
                } else {
                    updates.aiModel = 'llama-3.3-70b-versatile';
                    console.log(`  Fixing conversation ${conv._id}: Setting model to llama-3.3-70b-versatile`);
                }
            } else {
                // Check if model matches provider
                const isGroqModel = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it', 'mixtral-8x7b-32768'].includes(conv.aiModel);
                const isGeminiModel = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].includes(conv.aiModel);

                if (conv.aiProvider === 'gemini' && isGroqModel) {
                    needsUpdate = true;
                    updates.aiModel = 'gemini-2.5-flash';
                    console.log(`  Fixing conversation ${conv._id}: Gemini provider had Groq model ${conv.aiModel}, changing to gemini-2.5-flash`);
                } else if (conv.aiProvider === 'groq' && isGeminiModel) {
                    needsUpdate = true;
                    updates.aiModel = 'llama-3.3-70b-versatile';
                    console.log(`  Fixing conversation ${conv._id}: Groq provider had Gemini model ${conv.aiModel}, changing to llama-3.3-70b-versatile`);
                }
            }

            if (needsUpdate) {
                await Conversation.updateOne({ _id: conv._id }, updates);
                fixedCount++;
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} conversations`);
        console.log(`✅ ${conversations.length - fixedCount} conversations were already correct`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixConversations();
