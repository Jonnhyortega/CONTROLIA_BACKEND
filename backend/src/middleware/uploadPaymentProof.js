
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "controlia/payments",
    allowed_formats: ["png", "jpg", "jpeg", "webp", "pdf"], // Added pdf if possible, but cloudinary image transformation might fail on pdfs if not handled as raw. Sticking to images as requested "IMAGEN DE LA FACTURA".
    transformation: [{ width: 1000, crop: "limit" }],
  },
});

const uploadPaymentProof = multer({ storage });

export default uploadPaymentProof;
