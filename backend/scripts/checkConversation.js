// Check a specific conversation
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function checkConversation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find conversations with title "hii" or similar
        const conversations = await Conversation.find({ 
            title: { $regex: /hii/i } 
        }).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${conversations.length} conversations with "hii" in title:\n`);
        
        conversations.forEach(conv => {
            console.log(`Conversation ID: ${conv._id}`);
            console.log(`  Title: ${conv.title}`);
            console.log(`  Provider: ${conv.aiProvider}`);
            console.log(`  Model: ${conv.aiModel || 'NOT SET'}`);
            console.log(`  Created: ${conv.createdAt}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkConversation();
