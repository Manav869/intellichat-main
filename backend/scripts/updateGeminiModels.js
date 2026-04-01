// Update gemini-2.0-flash conversations to gemini-1.5-flash
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

async function updateGeminiModels() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update all gemini-2.0-flash to gemini-1.5-flash
        const result = await Conversation.updateMany(
            { aiModel: 'gemini-2.0-flash' },
            { $set: { aiModel: 'gemini-1.5-flash' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} conversations from gemini-2.0-flash to gemini-1.5-flash`);

        // Also update any other non-standard gemini models
        const result2 = await Conversation.updateMany(
            { 
                aiProvider: 'gemini',
                aiModel: { $nin: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-exp-1206'] }
            },
            { $set: { aiModel: 'gemini-1.5-flash' } }
        );

        console.log(`✅ Updated ${result2.modifiedCount} conversations with invalid Gemini models to gemini-1.5-flash`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateGeminiModels();
