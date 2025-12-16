
import express from "express";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import uploadPaymentProof from "../middleware/uploadPaymentProof.js";

const router = express.Router();

// Todas requieren autenticación
router.use(protect);

// Crear pago (Empleado o Admin) - Soporta imagen 'image'
router.post("/", uploadPaymentProof.single("image"), createTransaction);

// Listar pagos (Empleado o Admin)
router.get("/", getTransactions);

// Modificar pago (Solo Admin) - Soporta nueva imagen 'image'
router.put("/:id", adminOnly, uploadPaymentProof.single("image"), updateTransaction);

// Eliminar pago (Solo Admin)
router.delete("/:id", adminOnly, deleteTransaction);

export default router;
