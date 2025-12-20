import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createSubscription, handleWebhook } from "../controllers/subscriptionController.js";

const router = express.Router();

// Protected route to create a subscription preference
router.post("/create", protect, createSubscription);

// Public webhook route for Mercado Pago
router.post("/webhook", handleWebhook);

export default router;
