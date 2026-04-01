import { Router } from "express";
import { sendAIMessage, getAIResponse, streamAIMessage, getAIProviders, testAIProvider } from "../controllers/ai.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All AI routes require authentication
router.use(verifyJWT);

// AI Message Routes
router.route("/message").post(sendAIMessage);
router.route("/response").post(getAIResponse); // Non-streaming JSON response
router.route("/stream").post(streamAIMessage);

// AI Provider Routes
router.route("/providers").get(getAIProviders);
router.route("/test").post(testAIProvider);

export default router;
