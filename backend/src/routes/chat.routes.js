import { Router } from "express";
import { 
    createConversation, 
    getUserConversations, 
    getConversation, 
    sendMessage, 
    deleteConversation 
} from "../controllers/chat.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All chat routes require authentication
router.use(verifyJWT);

// Conversation routes
router.route("/conversations").get(getUserConversations);
router.route("/conversations").post(createConversation);
router.route("/conversations/:conversationId").get(getConversation);
router.route("/conversations/:conversationId").delete(deleteConversation);

// Message routes
router.route("/conversations/:conversationId/messages").post(sendMessage);

export default router;
