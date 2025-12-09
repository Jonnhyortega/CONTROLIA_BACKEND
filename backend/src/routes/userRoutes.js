import express from "express";
import {
    registerUser, 
    authUser, 
    getUserProfile, 
    updateUserProfile, 
    changeMyPassword,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
} from "../controllers/userController.js";
import validate from "../middleware/validateZod.js";
import { 
  registerSchema, 
  loginSchema, 
  updateUserSchema, 
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema
} from "../validators/userValidator.js";
import { googleSignIn } from "../controllers/oauthController.js";
import { googleSchema } from "../validators/userValidator.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 🔒 Rate limiting para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 intentos por ventana
  message: "Demasiados intentos. Por favor, intenta de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), authUser);
router.post("/google", authLimiter, validate(googleSchema), googleSignIn);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", authLimiter, validate(resendVerificationSchema), resendVerificationCode);

router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:token", authLimiter, resetPassword);

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validate(updateUserSchema), updateUserProfile);  
router.patch("/profile/password", protect, validate(changePasswordSchema), changeMyPassword);
export default router;
