// console.log("🟣 Cargando uploadLogo.js...");

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// console.log("🟣 Import OK, creando storage...");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "controlia/logos",
    allowed_formats: ["png", "jpg", "jpeg", "webp"],
    transformation: [{ width: 300, height: 300, crop: "limit" }],
  },
});

console.log("🟢 Storage creado");

const uploadLogo = multer({ storage });

console.log("🟢 uploadLogo listo");

export default uploadLogo;
