import express from "express";
import {
    registerUser, 
    authUser, 
    getUserProfile, 
    updateUserProfile, 
    changeMyPassword 
} from "../controllers/userController.js";
import validate from "../middleware/validateZod.js";
import { registerSchema, loginSchema, updateUserSchema, changePasswordSchema } from "../validators/userValidator.js";
import { googleSignIn } from "../controllers/oauthController.js";
import { googleSchema } from "../validators/userValidator.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), authUser);
router.post("/google", validate(googleSchema), googleSignIn);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validate(updateUserSchema), updateUserProfile);  
router.patch("/profile/password", protect, validate(changePasswordSchema), changeMyPassword);
export default router;
