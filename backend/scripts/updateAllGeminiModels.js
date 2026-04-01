import mongoose from 'mongoose';
import Conversation from '../src/models/conversation.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function updateAllGeminiConversations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // List of all invalid/old Gemini models
        const oldGeminiModels = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-2.0-flash',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        console.log('\n🔍 Checking all Gemini conversations...\n');

        // Find all conversations with old Gemini models
        const oldConversations = await Conversation.find({
            aiProvider: 'gemini',
            aiModel: { $in: oldGeminiModels }
        });

        if (oldConversations.length === 0) {
            console.log('✅ No conversations need updating');
        } else {
            console.log(`❌ Found ${oldConversations.length} conversations with old models:\n`);
            
            for (const conv of oldConversations) {
                console.log(`   - "${conv.title}" (${conv._id}): ${conv.aiModel}`);
            }

            console.log('\n🔧 Updating all to gemini-2.5-flash...\n');

            // Update all conversations
            const result = await Conversation.updateMany(
                {
                    aiProvider: 'gemini',
                    aiModel: { $in: oldGeminiModels }
                },
                {
                    $set: { aiModel: 'gemini-2.5-flash' }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} conversations to gemini-2.5-flash`);
        }

        // Show final stats
        console.log('\n📊 Final Gemini conversation stats:\n');
        const allGemini = await Conversation.find({ aiProvider: 'gemini' });
        
        const modelCounts = {};
        allGemini.forEach(conv => {
            modelCounts[conv.aiModel] = (modelCounts[conv.aiModel] || 0) + 1;
        });

        console.log('Model distribution:');
        Object.entries(modelCounts).forEach(([model, count]) => {
            console.log(`   ${model}: ${count} conversations`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

updateAllGeminiConversations();
