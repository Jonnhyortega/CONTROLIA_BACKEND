
import mongoose from "mongoose";
import dotenv from "dotenv";
import DailyCash from "./src/models/DailyCash.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/controlia";

const cleanExpenses = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Obtener la fecha de hoy para limpiar solo la caja actual (o ajustar según necesidad)
    const today = new Date();
    today.setHours(0,0,0,0);

    const dailyCashes = await DailyCash.find({ status: "abierta" });
    console.log(`Found ${dailyCashes.length} open daily cashes.`);

    for (const cash of dailyCashes) {
        console.log(`Processing cash ${cash._id} for user ${cash.user}`);
        
        let originalCount = cash.extraExpenses.length;
        
        // FILTRO MAGICO:
        // Mantener solo aquellos gastos que NO coincidan con el patrón de duplicación
        // El patrón de duplicación era: description empieza con "Pago a Proveedor" Y no tenian _id de transaccion real o era texto plano
        // Pero mejor aún, vamos a eliminar TODOS los gastos que parezcan pagos automaticos, 
        // ya que el sistema los regenerará dinámicamente al cargar el dashboard.
        
        const newExpenses = cash.extraExpenses.filter(expense => {
            // Si la descripción parece un pago automático generado por el frontend/backend anterior...
            // "Pago a Proveedor: ..."
            // Lo eliminamos. El sistema actual (getTodayCash) volverá a inyectar los REALES desde la colección Transactions.
            const isAutoPayment = expense.description && expense.description.startsWith("Pago a Proveedor");
            
            // Si es un gasto manual legítimo (ej: "Compra de resmas"), lo dejamos.
            return !isAutoPayment;
        });

        console.log(`- Expenses reduced from ${originalCount} to ${newExpenses.length}`);
        
        cash.extraExpenses = newExpenses;
        await cash.save();
        console.log("  Saved.");
    }

    console.log("Finished cleaning.");
    process.exit(0);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

cleanExpenses();
