import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError("Unauthorized request", 401);
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "your_access_secret_key");
        
        const user = await User.findById(decodedToken._id).select("-password -refreshTokenHash");
        
        if (!user) {
            throw new ApiError("Invalid access token", 401);
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError("Invalid access token", 401);
    }
};

export const verifyRefreshJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        
        if (!token) {
            throw new ApiError("Unauthorized request", 401);
        }

        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "your_refresh_secret_key");
        
        const user = await User.findById(decodedToken._id).select("+refreshTokenHash");
        
        if (!user) {
            throw new ApiError("Invalid refresh token", 401);
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError("Invalid refresh token", 401);
    }
};
