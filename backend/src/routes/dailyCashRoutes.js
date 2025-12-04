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
import validate from "../middleware/validateZod.js";
import { closeDailyCashSchema, updateDailyCashSchema } from "../validators/dailyCashValidator.js";

const router = express.Router();

router.get("/today", protect, getTodayCash);
router.get("/days", protect, getClosedCashDays);
router.get("/:date", protect, getDailyCashByDate);
router.post("/close", protect, validate(closeDailyCashSchema), closeDailyCash);
router.put("/:date", protect, validate(updateDailyCashSchema), updateDailyCashByDate);
router.post("/:id/close", protect, validate(closeDailyCashSchema), closeDailyCashById);


export default router;
