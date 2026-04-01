import mongoose from 'mongoose';
import Conversation from '../src/models/conversation.models.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellichat';

async function checkHiiConversation() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all conversations with title "hii"
        const conversations = await Conversation.find({ title: /hii/i });

        console.log('\n🔍 Found', conversations.length, 'conversation(s) matching "hii"\n');

        for (const conv of conversations) {
            console.log('═══════════════════════════════════════════════════');
            console.log('📝 Conversation ID:', conv._id);
            console.log('📝 Title:', conv.title);
            console.log('📝 aiProvider:', conv.aiProvider);
            console.log('📝 aiModel:', conv.aiModel);
            console.log('📝 Created:', conv.createdAt);
            console.log('═══════════════════════════════════════════════════\n');
        }

        // Also show ALL Gemini conversations to be thorough
        const geminiConvs = await Conversation.find({ aiProvider: 'gemini' });
        console.log('\n📊 Total Gemini conversations:', geminiConvs.length);
        console.log('\n🔍 All Gemini conversation models:');
        geminiConvs.forEach(conv => {
            console.log(`  - "${conv.title}" (${conv._id}): ${conv.aiModel}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkHiiConversation();
