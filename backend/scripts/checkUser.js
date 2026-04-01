import mongoose from 'mongoose';
import { User } from '../src/models/user.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'shashibhushan847305@gmail.com';
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('\n📝 User Preferences:');
        console.log('   Email:', user.email);
        console.log('   aiProvider:', user.preferences?.aiProvider);
        console.log('   aiModel:', user.preferences?.aiModel);
        console.log('   theme:', user.preferences?.theme);
        
        // If preferences are wrong, update them
        if (user.preferences?.aiProvider === 'gemini' && 
            (user.preferences?.aiModel === 'gemini-1.5-pro' || 
             user.preferences?.aiModel === 'gemini-1.5-flash')) {
            
            console.log('\n🔧 Updating user preferences to gemini-2.5-flash...');
            
            user.preferences.aiModel = 'gemini-2.5-flash';
            await user.save();
            
            console.log('✅ User preferences updated!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkUser();
