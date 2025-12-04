import express from "express";
import {
  getCustomization,
  updateCustomization,
  uploadLogoController,
  resetCustomization
} from "../controllers/customizationController.js";

import { protect } from "../middleware/authMiddleware.js";
import uploadLogo from "../middleware/uploadLogo.js"; // <-- Cloudinary storage real

const router = express.Router();

router.get("/", protect, getCustomization);
router.put("/", protect, updateCustomization);

// ⬇️ USAR SOLO ESTA, NADA DE MULTER LOCAL
router.post("/logo", protect, uploadLogo.single("logo"), uploadLogoController);
// test endpoint
router.post("/logo-test-public", (req, res) => {
  console.log("🔥 Entró a /logo-test-public");
  res.json({ ok: true });
});


router.post("/reset", protect, resetCustomization);

export default router;
