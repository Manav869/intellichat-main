// Comprehensive fix for all provider/model mismatches
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
    lastMessageAt: Date
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

// Define valid models for each provider
const VALID_MODELS = {
    groq: [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'gemma2-9b-it',
        'mixtral-8x7b-32768'
    ],
    gemini: [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
    ]
};

const DEFAULT_MODELS = {
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-1.5-flash'
};

async function fixAllMismatches() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const conversations = await Conversation.find({});
        console.log(`📊 Found ${conversations.length} total conversations\n`);

        let fixedCount = 0;
        const issues = [];

        for (const conv of conversations) {
            let needsUpdate = false;
            const updates = {};
            const problem = { id: conv._id, title: conv.title };

            // Check 1: Missing aiProvider
            if (!conv.aiProvider) {
                needsUpdate = true;
                updates.aiProvider = 'groq';
                problem.issue = 'Missing aiProvider';
                problem.fix = 'Set to groq';
            }

            // Check 2: Missing aiModel
            if (!conv.aiModel) {
                needsUpdate = true;
                updates.aiModel = DEFAULT_MODELS[updates.aiProvider || conv.aiProvider];
                problem.issue = (problem.issue || '') + ' Missing aiModel';
                problem.fix = (problem.fix || '') + ` Set to ${updates.aiModel}`;
            }

            // Check 3: Provider/Model mismatch
            const provider = updates.aiProvider || conv.aiProvider;
            const model = updates.aiModel || conv.aiModel;

            if (provider && model) {
                const isGroqModel = VALID_MODELS.groq.includes(model);
                const isGeminiModel = VALID_MODELS.gemini.includes(model);

                if (provider === 'groq' && !isGroqModel) {
                    needsUpdate = true;
                    updates.aiModel = DEFAULT_MODELS.groq;
                    problem.issue = `Groq provider with invalid model: ${model}`;
                    problem.fix = `Changed model to ${updates.aiModel}`;
                } else if (provider === 'gemini' && !isGeminiModel) {
                    needsUpdate = true;
                    updates.aiModel = DEFAULT_MODELS.gemini;
                    problem.issue = `Gemini provider with invalid model: ${model}`;
                    problem.fix = `Changed model to ${updates.aiModel}`;
                }
            }

            if (needsUpdate) {
                console.log(`🔧 Fixing conversation: ${conv._id}`);
                console.log(`   Title: ${conv.title}`);
                console.log(`   Current: ${conv.aiProvider} / ${conv.aiModel}`);
                console.log(`   Updates:`, updates);
                
                await Conversation.updateOne({ _id: conv._id }, updates);
                fixedCount++;
                issues.push(problem);
                console.log('   ✅ Fixed\n');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Fixed ${fixedCount} conversations`);
        console.log(`✅ ${conversations.length - fixedCount} conversations were already correct`);
        console.log('='.repeat(60));

        if (issues.length > 0) {
            console.log('\n📋 Summary of fixes:');
            issues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue.title}`);
                console.log(`   Problem: ${issue.issue}`);
                console.log(`   Fix: ${issue.fix}\n`);
            });
        }

        // Verify all conversations now
        console.log('\n🔍 Verifying all conversations...');
        const allConvs = await Conversation.find({});
        let valid = 0;
        let invalid = 0;

        for (const conv of allConvs) {
            const isValid = 
                conv.aiProvider && 
                conv.aiModel && 
                VALID_MODELS[conv.aiProvider]?.includes(conv.aiModel);
            
            if (isValid) {
                valid++;
            } else {
                invalid++;
                console.log(`⚠️  Still invalid: ${conv._id} - ${conv.aiProvider}/${conv.aiModel}`);
            }
        }

        console.log(`\n✅ Valid: ${valid}`);
        console.log(`❌ Invalid: ${invalid}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixAllMismatches();
