import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
 
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Reference to the user
  },
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google'] // Allowed providers
  },
  apiKey: {
    type: String,
    required: true // Encrypted API key
  },
  isActive: {
    type: Boolean,
    default: true // Key status
  },
  createdAt: {
    type: Date,
    default: Date.now // Key addition date
  }
});

// Add compound index for efficient querying by userId and provider
apiKeySchema.index({ userId: 1, provider: 1 });

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);