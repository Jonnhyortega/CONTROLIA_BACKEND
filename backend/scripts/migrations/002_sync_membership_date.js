import User from "../../src/models/User.js";

export default {
  version: "002",
  name: "sync_membership_date_with_created_at",
  description: "Set membershipStartDate to createdAt for all users to enforce trial start at registration",

  async up() {
    console.log("📦 Ejecutando migración: sync_membership_date_with_created_at");

    // Usamos updateMany con pipeline de agregación para igualar campos
    const result = await User.updateMany(
      {},
      [
        {
          $set: {
            membershipStartDate: "$createdAt"
          }
        }
      ]
    );

    console.log(`✅ ${result.modifiedCount} usuarios sincronizados (membershipStartDate = createdAt)`);
    return result;
  },

  async down() {
    console.log("⏪ Revirtiendo migración: sync_membership_date_with_created_at");
    // No hay una reversión lógica clara porque estaríamos volviendo a un estado inconsistente.
    // Podríamos setear a null si quisiéramos volver al estado anterior, pero el requerimiento cambió.
    console.log("⚠️ Reversión no aplicable para esta sincronización.");
    return { ok: true };
  },
};
