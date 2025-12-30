import express from "express";
import {
  getTodayCash,
  closeDailyCash,
  getClosedCashDays,
  getDailyCashByDate,
  updateDailyCashByDate,
  closeDailyCashById
} from "../controllers/dailyCashController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";
import validate from "../middleware/validateZod.js";
import { closeDailyCashSchema, updateDailyCashSchema } from "../validators/dailyCashValidator.js";

const router = express.Router();

router.get("/today", protect, checkSubscription, getTodayCash);
router.get("/days/:id", protect, checkSubscription, getClosedCashDays);
router.get("/:date", protect, checkSubscription, getDailyCashByDate);
router.post("/close", protect, checkSubscription, validate(closeDailyCashSchema), closeDailyCash);
router.put("/:date", protect, checkSubscription, validate(updateDailyCashSchema), updateDailyCashByDate);
router.post("/:id/close", protect, checkSubscription, validate(closeDailyCashSchema), closeDailyCashById);


export default router;
