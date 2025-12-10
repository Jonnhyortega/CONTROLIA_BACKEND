import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const user = await User.findOne().lean();
    if (user) {
        console.log("Muestra de usuario:");
        console.log(`- ID: ${user._id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- membershipStartDate: ${user.membershipStartDate}`);
        console.log(`- createdAt: ${user.createdAt}`);
        // Nota: trialDaysRemaining no saldrá aquí porque es .lean() y es calculado, no guardado.
    } else {
        console.log("No se encontraron usuarios.");
    }
    
    const count = await User.countDocuments({ membershipStartDate: { $exists: false } });
    console.log(`Usuarios sin membershipStartDate: ${count}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
})();
