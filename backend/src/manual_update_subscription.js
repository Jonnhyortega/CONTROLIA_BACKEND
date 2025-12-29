
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI not found in .env");
    process.exit(1);
}

const updateSubscription = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Cambia este email por el que usaste en tu App (no necesariamente el de test buyer)
        // Como no sé tu email exacto, buscaré el último creado o puedes editar esto.
        
        let user;
        const targetEmail = process.argv[2]; // email from command line

        if (targetEmail) {
            user = await User.findOne({ email: targetEmail });
        } else {
            // Find most recent user
            user = await User.findOne().sort({ createdAt: -1 });
            console.log("⚠️ No se pasó email por argumento. Usando el ÚLTIMO usuario creado.");
        }

        if (!user) {
            console.log("❌ No se encontró ningún usuario.");
            process.exit(1);
        }

        console.log(`👤 Usuario encontrado: ${user.email} (${user.name})`);
        console.log(`   Estado actual: ${user.subscriptionStatus || 'null'} | Plan: ${user.membershipTier}`);

        // Update fields
        user.subscriptionStatus = "authorized";
        user.membershipTier = "basic"; // Asumimos Plan Base, cambia si es otro
        
        // Extend membership end date by 30 days from now
        const nextPayment = new Date();
        nextPayment.setDate(nextPayment.getDate() + 30);
        user.membershipEndDate = nextPayment;

        // Force membershipStartDate to something that makes trial 0 if needed, 
        // or actually `calculateTrialDaysRemaining` depends on `membershipStartDate` + 30 days.
        // If we want to verify it shows 'Official' instead of 'Trial', the frontend likely checks `membershipTier`.
        // The frontend code showed: 
        // {user?.membershipTier === 'basic' ? 'Plan Base (Prueba)' : ...
        // Wait, if tier is basic, it SAYS "Plan Base (Prueba)".
        // Ah, let's look at the frontend code again.
        
        /* 
        63:                 {user?.membershipTier === 'basic' ? 'Plan Base (Prueba)' : 
        64:                  user?.membershipTier === 'gestion' ? 'Plan Gestión' :
        65:                  user?.membershipTier === 'avanzado' ? 'Plan Avanzado' : 'Plan Base'}
        */
        
        // It seems 'basic' is HARDCODED to show "(Prueba)". 
        // IF the user bought the "Basic" plan, we might need a way to distinguish 'Trial Basic' from 'Paid Basic'.
        // However, usually 'basic' implies the free/trial tier in this code's logic?
        // Let's check if there's a 'free' tier or if 'basic' IS the paid one.
        // If 'basic' is the paid one, then the frontend label is confusing or wrong.
        
        // But for now, let's update status to 'authorized'.
        
        await user.save();
        console.log("✅ ¡Actualización exitosa!");
        console.log("   Nuevo Estado: authorized");
        console.log("   Nuevo Plan: basic");
        console.log("   Vencimiento: " + nextPayment.toISOString());
        
        console.log("\n👉 Ahora recarga tu Dashboard en el navegador.");

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

updateSubscription();
