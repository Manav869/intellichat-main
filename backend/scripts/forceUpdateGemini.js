// Force update ALL Gemini conversations to use gemini-1.5-flash
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
    aiModel: String
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

async function forceUpdateAllGemini() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update ALL Gemini conversations to use gemini-1.5-flash
        const result = await Conversation.updateMany(
            { aiProvider: 'gemini' },
            { $set: { aiModel: 'gemini-1.5-flash' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} Gemini conversations to gemini-1.5-flash`);
        console.log(`📊 Total Gemini conversations: ${result.matchedCount}`);

        // Verify
        const geminiConvs = await Conversation.find({ aiProvider: 'gemini' }).limit(10);
        console.log('\n📋 Sample of Gemini conversations:');
        geminiConvs.forEach(conv => {
            console.log(`  - ${conv.title}: ${conv.aiProvider} / ${conv.aiModel}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

forceUpdateAllGemini();
