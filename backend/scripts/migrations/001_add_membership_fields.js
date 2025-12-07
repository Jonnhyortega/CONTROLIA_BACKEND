import User from "../../src/models/User.js";

export default {
  version: "001",
  name: "add_membership_and_verification_fields",
  description: "Agregar campos de membresía y verificación de email a usuarios existentes",

  async up() {
    console.log("📦 Ejecutando migración: add_membership_and_verification_fields");

    const result = await User.updateMany(
      {
        $or: [
          { membershipTier: { $exists: false } },
          { isEmailVerified: { $exists: false } },
        ],
      },
      {
        $set: {
          // Membresía
          membershipTier: "basic",
          membershipStartDate: new Date(),
          membershipEndDate: null,
          
          // Verificación de email (usuarios existentes ya están verificados)
          isEmailVerified: true,
          verificationCode: null,
          verificationCodeExpires: null,
          
          // Estado activo (usuarios existentes ya están activos)
          active: true,
        },
      }
    );

    console.log(`✅ ${result.modifiedCount} usuarios actualizados`);
    return result;
  },

  async down() {
    console.log("⏪ Revirtiendo migración: add_membership_and_verification_fields");

    const result = await User.updateMany(
      {},
      {
        $unset: {
          membershipTier: "",
          membershipStartDate: "",
          membershipEndDate: "",
          isEmailVerified: "",
          verificationCode: "",
          verificationCodeExpires: "",
        },
      }
    );

    console.log(`✅ ${result.modifiedCount} usuarios revertidos`);
    return result;
  },
};
