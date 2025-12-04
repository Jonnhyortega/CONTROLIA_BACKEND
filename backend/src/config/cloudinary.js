import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// resolver path real de cloudinary.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cargar .env desde backend/
dotenv.config({ path: path.join(__dirname, "../../.env") });

// console.log("🔮 Cloudinary config cargado:", {
//   name: process.env.CLOUDINARY_CLOUD_NAME,
//   key: process.env.CLOUDINARY_API_KEY,
//   secret: process.env.CLOUDINARY_API_SECRET,
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
