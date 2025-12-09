import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import path from "path";
import { fileURLToPath } from "url";

// Configurar dotenv (el .env está en la raíz, un nivel arriba de scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const updateUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI no definida en .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const users = await User.find({});
    console.log(`🔍 Encontrados ${users.length} usuarios.`);

    let updatedCount = 0;
    for (const user of users) {
      let modified = false;

      // Si no tiene businessName, usar "Negocio de [Nombre]"
      if (!user.businessName) {
        user.businessName = `Negocio de ${user.name}`;
        modified = true;
      }

      // Si no tiene address (es undefined), inicializar en ""
      if (user.address === undefined) {
        user.address = "";
        modified = true;
      }

      if (modified) {
        // Validar antes de guardar para evitar errores de validación del modelo si faltan otros campos
        // Pero como estamos seteando los faltantes, debería estar bien.
        await user.save();
        updatedCount++;
        console.log(`✏️ Actualizado usuario: ${user.email}`);
      }
    }

    console.log(`✨ Proceso finalizado. Total actualizados: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

updateUsers();
