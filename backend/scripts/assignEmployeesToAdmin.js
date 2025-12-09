import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const assignEmployees = async () => {
  const adminEmail = process.argv[2]; // Email pasado como argumento

  if (!adminEmail) {
    console.error("❌ Por favor, proporciona el email del administrador.");
    console.error("Uso: node scripts/assignEmployeesToAdmin.js admin@email.com");
    process.exit(1);
  }

  try {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI no definida en .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const admin = await User.findOne({ email: adminEmail }); // Quitamos role: 'admin' por si acaso el usuario tiene otro rol pero es el jefe
    if (!admin) {
      console.error(`❌ No se encontró un usuario con el email: ${adminEmail}`);
      process.exit(1);
    }

    console.log(`👤 Administrador encontrado: ${admin.name} (${admin._id})`);
    console.log(`🏢 Negocio: ${admin.businessName}`);

    const result = await User.updateMany(
      { role: "empleado", createdBy: null },
      { $set: { createdBy: admin._id, businessName: admin.businessName } }
    );

    console.log(`✨ Se vincularon ${result.modifiedCount} empleados huérfanos.`);
    console.log(`Ahora pertenecen a ${admin.name}.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

assignEmployees();
