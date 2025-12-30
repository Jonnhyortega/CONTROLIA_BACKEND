import express from "express";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

const router = express.Router();

router.route("/")
  .get(protect, checkSubscription, getSuppliers)
  .post(protect, checkSubscription, createSupplier);

router.route("/:id")
  .put(protect, checkSubscription, updateSupplier)
  .delete(protect, checkSubscription, deleteSupplier);

export default router;
