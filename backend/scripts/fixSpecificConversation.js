import mongoose from 'mongoose';
import Conversation from '../src/models/conversation.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixSpecificConversation() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const conversationId = '6903b24a9da13bee9770b0f5'; // The "hii" conversation

        // Find the conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            console.log('❌ Conversation not found');
            return;
        }

        console.log('\n📝 BEFORE UPDATE:');
        console.log('   Title:', conversation.title);
        console.log('   aiProvider:', conversation.aiProvider);
        console.log('   aiModel:', conversation.aiModel);

        // Update the conversation
        conversation.aiModel = 'gemini-1.5-flash';
        await conversation.save();

        console.log('\n✅ AFTER UPDATE:');
        console.log('   Title:', conversation.title);
        console.log('   aiProvider:', conversation.aiProvider);
        console.log('   aiModel:', conversation.aiModel);

        // Also check ALL Gemini conversations that still have wrong models
        console.log('\n\n🔍 Checking ALL Gemini conversations for invalid models...\n');
        const invalidModels = ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-pro'];
        
        const badConversations = await Conversation.find({
            aiProvider: 'gemini',
            aiModel: { $in: invalidModels }
        });

        if (badConversations.length > 0) {
            console.log(`❌ Found ${badConversations.length} conversations with invalid models:`);
            for (const conv of badConversations) {
                console.log(`   - "${conv.title}" (${conv._id}): ${conv.aiModel}`);
            }

            console.log('\n🔧 Fixing all of them...');
            const result = await Conversation.updateMany(
                {
                    aiProvider: 'gemini',
                    aiModel: { $in: invalidModels }
                },
                {
                    $set: { aiModel: 'gemini-1.5-flash' }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} conversations to gemini-1.5-flash`);
        } else {
            console.log('✅ No invalid Gemini models found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

fixSpecificConversation();
