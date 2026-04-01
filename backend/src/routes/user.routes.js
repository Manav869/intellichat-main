import {Router} from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserPreferences } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT, verifyRefreshJWT } from "../middleware/auth.middleware.js";

const router=Router();

// Registration with file upload (form-data)
router.route("/register").post(
    upload.single("avatar"),
    registerUser
);

router.route("/login").post(loginUser);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyRefreshJWT, refreshAccessToken);
router.route("/preferences").put(verifyJWT, updateUserPreferences);

router.route("/sameroute").post(
    (req, res) => {
        res.status(200).json({ message: 'POST route working fine!' });
    }
);

export default router;