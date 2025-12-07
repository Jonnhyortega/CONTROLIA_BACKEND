import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const migrateUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Actualizar todos los usuarios que no tienen los campos nuevos
    const result = await User.updateMany(
      {
        // Buscar usuarios sin los campos nuevos
        $or: [
          { membershipTier: { $exists: false } },
          { isEmailVerified: { $exists: false } },
          { membershipStartDate: { $exists: false } },
        ],
      },
      {
        $set: {
          membershipTier: "basic",
          isEmailVerified: true, // Usuarios existentes ya están "verificados"
          active: true, // Usuarios existentes ya están activos
          membershipStartDate: new Date(),
          membershipEndDate: null,
          verificationCode: null,
          verificationCodeExpires: null,
        },
      }
    );

    console.log(`✅ Migración completada: ${result.modifiedCount} usuarios actualizados`);
    
    // Mostrar algunos usuarios para verificar
    const users = await User.find().limit(3).select("name email membershipTier isEmailVerified active");
    console.log("\n📋 Usuarios de ejemplo:");
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): ${user.membershipTier}, verified: ${user.isEmailVerified}, active: ${user.active}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
};

migrateUsers();
