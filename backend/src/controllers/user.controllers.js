import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    // Handle both JSON and form-data
    const { email, password, name } = req.body;
    
    // Debug: Log the request body
    console.log("Registration request body:", req.body);
    console.log("Registration request files:", req.files);
    
    // Check if req.body exists
    if (!req.body) {
        return res.status(400).json({
            success: false,
            message: "Request body is missing. Make sure to send data as JSON or form-data."
        });
    }
    
    // Validation
    if ([email, password, name].some(field => !field || field.trim() === "")) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    // Email format validation
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
        throw new ApiError("Please enter a valid email address", 400);
    }

    // Password length validation
    if (password.length < 6) {
        throw new ApiError("Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError("User already exists with this email", 400);
    }

    // Handle avatar upload (optional)
    let avatarUrl = "";
    if (req.files?.avatar?.[0]?.path) {
        const avatarlocalPath = req.files.avatar[0].path;
        const cloudinaryResponse = await uploadFileOnCloudinary(avatarlocalPath);
        if (!cloudinaryResponse) {
            throw new ApiError("Failed to upload avatar", 500);
        }
        avatarUrl = cloudinaryResponse.secure_url;
    }
    // If no avatar provided, avatarUrl remains empty string (default from model)

    // Create user
    console.log("Creating user with password:", password);
    const user = await User.create({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        avatar: avatarUrl
    });
    console.log("User created successfully. Password hash length:", user.password ? user.password.length : 0);

    // Generate JWT tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Hash and store refresh token
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshHash;
    await user.save({ validateBeforeSave: false });

    // Remove password from response
    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax', // PERFECT for cross-origin
        maxAge: process.env.ACCESS_TOKEN_EXPIRY ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 : 15 * 60 * 1000
    };

    const refreshCookieOptions = {
        ...cookieOptions,
        maxAge: process.env.REFRESH_TOKEN_EXPIRY ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 : 7 * 24 * 60 * 60 * 1000
    };

    // Debug: Log cookie setting
    console.log("Setting cookies for registration:", {
        accessToken: accessToken ? "Present" : "Missing",
        refreshToken: refreshToken ? "Present" : "Missing",
        cookieOptions
    });

    res.status(201)
       .cookie("accessToken", accessToken, cookieOptions)
       .cookie("refreshToken", refreshToken, refreshCookieOptions)
       .json({
           success: true,
           message: "User registered successfully",
           user: userResponse
       });
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        // Debug: Log the request body
        console.log("Login request body:", req.body);
        
        // Check if req.body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is missing. Make sure to send data as JSON."
            });
        }
        
        const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ApiError("Email and password are required", 400);
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    console.log("User found:", user ? "Yes" : "No");
    if (!user) {
        console.log("User not found for email:", email);
        throw new ApiError("Invalid email or password", 401);
    }

    // Compare password with bcrypt
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    if (!isPasswordValid) {
        console.log("Password mismatch for user:", email);
        throw new ApiError("Invalid email or password", 401);
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Hash and store refresh token using bcrypt (so you can verify/rotate later)
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshHash;
    await user.save({ validateBeforeSave: false });

    // Remove password from response
    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax', // PERFECT for cross-origin
        maxAge: process.env.ACCESS_TOKEN_EXPIRY ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 : 15 * 60 * 1000
    };

    const refreshCookieOptions = {
        ...cookieOptions,
        maxAge: process.env.REFRESH_TOKEN_EXPIRY ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 : 7 * 24 * 60 * 60 * 1000
    };

        // send cookies (do not store plain tokens server-side)
        res.status(200)
           .cookie("accessToken", accessToken, cookieOptions)
           .cookie("refreshToken", refreshToken, refreshCookieOptions)
           .json({
               success: true,
               message: "User logged in successfully",
               user: userResponse
           });
    } catch (error) {
        console.log("Login error:", error.message);
        console.log("Error stack:", error.stack);
        throw error;
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    console.log("Logout request received");
    console.log("User from middleware:", req.user ? "Present" : "Missing");
    console.log("User ID:", req.user ? req.user._id : "N/A");
    
    // Clear refresh token from database
    const user = await User.findById(req.user._id);
    console.log("User found in database:", user ? "Yes" : "No");
    if (user) {
        user.refreshTokenHash = null;
        await user.save({ validateBeforeSave: false });
        console.log("Refresh token cleared from database");
    }

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        maxAge: 0 // Expire immediately
    };

    res.status(200)
       .cookie("accessToken", "", cookieOptions)
       .cookie("refreshToken", "", cookieOptions)
       .json({
           success: true,
           message: "User logged out successfully"
       });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError("Unauthorized request", 401);
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET || "your_refresh_secret_key"
        );

        const user = await User.findById(decodedToken._id).select('+refreshTokenHash');
        if (!user) {
            throw new ApiError("Invalid refresh token", 401);
        }

        // Verify the refresh token hash
        const isRefreshTokenValid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
        if (!isRefreshTokenValid) {
            throw new ApiError("Invalid refresh token", 401);
        }

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update refresh token hash
        const refreshHash = await bcrypt.hash(refreshToken, 10);
        user.refreshTokenHash = refreshHash;
        await user.save({ validateBeforeSave: false });

        // Prepare user response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            preferences: user.preferences,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax', // PERFECT for cross-origin
            maxAge: process.env.ACCESS_TOKEN_EXPIRY ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 : 15 * 60 * 1000
        };

        const refreshCookieOptions = {
            ...cookieOptions,
            maxAge: process.env.REFRESH_TOKEN_EXPIRY ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 : 7 * 24 * 60 * 60 * 1000
        };

        res.status(200)
           .cookie("accessToken", accessToken, cookieOptions)
           .cookie("refreshToken", refreshToken, refreshCookieOptions)
           .json({
               success: true,
               message: "Access token refreshed successfully",
               user: userResponse
           });

    } catch (error) {
        throw new ApiError("Invalid refresh token", 401);
    }
});

const updateUserPreferences = asyncHandler(async (req, res) => {
    const { theme, language, aiProvider, aiModel } = req.body;
    
    // Validate aiProvider if provided
    if (aiProvider && !['groq', 'gemini'].includes(aiProvider)) {
        throw new ApiError("Invalid AI provider. Must be 'groq' or 'gemini'", 400);
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Update preferences
    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;
    if (aiProvider) user.preferences.aiProvider = aiProvider;
    if (aiModel) user.preferences.aiModel = aiModel;

    await user.save();

    // Return updated user
    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };

    res.status(200).json({
        success: true,
        message: "Preferences updated successfully",
        user: userResponse
    });
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserPreferences };