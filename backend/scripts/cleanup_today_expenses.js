import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DailyCash from '../src/models/DailyCash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar env
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

const dayToClean = "2025-12-30"; // Fecha solicitada

const cleanToday = async () => {
  try {
    if (!MONGO_URI) {
        throw new Error("MONGO_URI no definida en .env");
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Calcular rango UTC para Argentina (GMT-3)
    // 30/12 00:00:00-03:00
    const start = new Date(`${dayToClean}T00:00:00-03:00`);
    const end = new Date(`${dayToClean}T23:59:59.999-03:00`);

    console.log(`🧹 Limpiando gastos (extraExpenses y supplierPayments) para el día: ${dayToClean}`);
    
    // ACTUALIZACION: Usar $set para limpiar los arrays corruptos
    const result = await DailyCash.updateMany(
      {
        date: { $gte: start, $lte: end }
      },
      {
        $set: { 
            extraExpenses: [],
            supplierPayments: [],
            status: "abierta" 
        }
      }
    );

    console.log(`✨ Resultado: ${result.modifiedCount} cajas limpiadas.`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

cleanToday();
