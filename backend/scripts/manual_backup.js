import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno ANTES de importar servicios
dotenv.config({ path: path.join(__dirname, "../.env") });

import backupService from "../src/services/backupService.js";

const runManualBackup = async () => {
  console.log("🚀 Iniciando backup manual...");
  try {
    const result = await backupService.performBackup();
    console.log("✅ Backup completado con éxito!");
    console.log("📄 File ID en Drive:", result.fileId);
    console.log("⏰ Timestamp:", result.timestamp);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en backup manual:", error);
    process.exit(1);
  }
};

runManualBackup();
