import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const preferencesSchema = new mongoose.Schema({
  theme: {
    type: String,
    default: 'light'
  },
  language: {
    type: String,
    default: 'en'
  },
  defaultModel: {
    type: String,
    default: 'gpt-4'
  }
}, { _id: false });
const userSchema=new mongoose.Schema({
  email: {
      type: String,
      required: true,
      unique: true,
      index: true,
       match: [
      /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
      'Please enter a valid email address'
    ]
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    preferences: {
      theme: { type: String, default: "light" },
      language: { type: String, default: "en" },
      aiProvider: { 
        type: String, 
        enum: ['groq', 'gemini'],
        default: "groq" 
      },
      aiModel: { 
        type: String, 
        default: "llama-3.3-70b-versatile" 
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false // Exclude from query results by default
    },
  },
  {
    timestamps: true, // 👈 Automatically adds createdAt and updatedAt
  }
  
);

// Add additional indexes for better query performance
// Note: email index is already defined in schema with index: true
userSchema.index({ createdAt: -1 }); // For sorting by registration date
userSchema.index({ lastLogin: -1 }); // For finding recently active users
userSchema.index({ name: 1 }); // For searching users by name
userSchema.pre('save', async function (next) {
  if(!this.isModified('password')){
    return next();
  }
  try {
    // Only hash the password if it has been modified (or is new)
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
})
userSchema.methods.comparePassword=async function(candidatePassword){ 
  try {
    console.log("Comparing password:");
    console.log("Candidate password:", candidatePassword);
    console.log("Stored password hash:", this.password ? "Present" : "Missing");
    console.log("Password hash length:", this.password ? this.password.length : 0);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result:", isMatch);
    
    return isMatch;
  } catch (error) {
    console.log("Password comparison error:", error.message);
    throw error;
  }
};



// Token generation methods
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.REFRESH_TOKEN_SECRET || "your_refresh_secret_key",
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
        }
    );
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET || "your_access_secret_key",
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
        }
    );
};
  
   


export const User=  mongoose.model("User",userSchema);