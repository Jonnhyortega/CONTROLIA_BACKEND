import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// resolver correctamente este archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cargar .env desde la raíz del backend
dotenv.config({ path: path.join(__dirname, "../.env") });

// IMPORTS CORRECTOS
import connectDB from "./config/db_temp.js";
import app from "./app.js";
import validateEnv from "./utils/validateEnv.js";
import initScheduler from "./scheduler/backupScheduler.js";

// 🔐 Validar variables de entorno antes de iniciar
validateEnv();

// DEBUG
// console.log("🌱 ENV DEBUG:", {
//   PORT: process.env.PORT,
//   MONGO_URI: process.env.MONGO_URI,
//   CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
// });

connectDB();

const PORT = process.env.PORT || 5000;
initScheduler(); // Iniciar tareas programadas
app.listen(PORT, () =>
  console.log(`🚀 Controlia backend corriendo en puerto ${PORT}`)
);
