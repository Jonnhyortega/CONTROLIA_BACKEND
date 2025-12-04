import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
  revertSale, // ✅ agregá esto
} from "../controllers/saleController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateZod.js";
import { createSaleSchema } from "../validators/saleValidator.js";

const router = express.Router();

// ✅ Listar todas las ventas y crear nueva
router.route("/")
  .get(protect, getSales)
  .post(protect, validate(createSaleSchema), createSale);

// ✅ Obtener detalle de venta
router.route("/:id").get(protect, getSaleById);

// ✅ Revertir venta
router.post("/:id/revert", protect, revertSale);

export default router;
