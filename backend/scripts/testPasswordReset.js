import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// Configurar entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const testFlow = async () => {
    const testEmail = "test_flow@controlia.com";
    const newPassword = "newPassword123";

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a DB");

        // 1. Crear o buscar usuario
        await User.deleteOne({ email: testEmail }); // Limpiar previo
        const user = await User.create({
            name: "Test Flow",
            businessName: "Test Business",
            email: testEmail,
            password: "oldPassword456",
            role: "admin"
        });
        console.log("👤 Usuario creado/encontrado:", user.email);

        // 2. Simular Forgot Password (generar token)
        const resetTokenRaw = crypto.randomBytes(20).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetTokenRaw).digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();
        console.log("🔗 Token generado y guardado. Token Raw:", resetTokenRaw);

        // 3. Simular Reset Password (consumir token)
        // Buscar usuario por token
        const foundUser = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!foundUser) throw new Error("Usuario no encontrado con el token generado");

        console.log("🔓 Usuario encontrado por token. Actualizando password...");
        foundUser.password = newPassword;
        foundUser.resetPasswordToken = undefined;
        foundUser.resetPasswordExpire = undefined;
        
        await foundUser.save(); // Esto debería disparar el pre('save')
        console.log("✅ Password actualizada y guardada.");

        // 4. Verificar login
        // Recargar usuario de la DB para asegurar que leemos lo guardado
        const userInDb = await User.findOne({ email: testEmail });
        
        console.log("🕵️ Verificando contraseña...");
        console.log("   Password en DB (Hash):", userInDb.password);
        console.log("   Password a probar:", newPassword);

        const isMatch = await userInDb.matchPassword(newPassword);

        if (isMatch) {
            console.log("🎉 ÉXITO: La contraseña nueva funciona correctamente.");
        } else {
            console.error("⛔ FALLO: La contraseña nueva NO matchea con el hash guardado.");
            console.log("   Posible causa: El hook pre('save') no se ejecutó o hasheó incorrectamente.");
        }

    } catch (error) {
        console.error("❌ Error en el test:", error);
    } finally {
        // Limpieza
        if (mongoose.connection.readyState === 1) {
            await User.deleteOne({ email: testEmail });
            await mongoose.disconnect();
        }
    }
};

testFlow();
