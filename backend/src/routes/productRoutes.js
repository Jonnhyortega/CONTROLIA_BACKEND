import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductHistory,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";
import validate from "../middleware/validateZod.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidator.js";

const router = express.Router();

// 🔒 solo usuarios autenticados pueden listar, y solo admin puede crear/editar/eliminar
router.route("/")
  .get(protect, checkSubscription, getProducts)
  // Permitir que cualquier usuario autenticado cree productos bajo su usuario.
  // El controller ya asigna `user: req.user._id` y valida proveedor por user, por lo que
  // limitar a "adminOnly" no es necesario si queremos que cada cuenta maneje sus productos.
  .post(protect, checkSubscription, validate(createProductSchema), createProduct);

router.get("/:id/history", protect, checkSubscription, getProductHistory); // NUEVA RUTA de historial

router.route("/:id")
  .get(protect, checkSubscription, getProductById)
  // Permitimos a usuarios autenticados actualizar/eliminar únicamente sus propios productos
  // (el controller hace `findOne({ _id: req.params.id, user: req.user._id })`).
  .put(protect, checkSubscription, validate(updateProductSchema), updateProduct)
  .delete(protect, checkSubscription, deleteProduct);

export default router;
