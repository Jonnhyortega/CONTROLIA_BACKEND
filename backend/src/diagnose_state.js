
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("\n🔍 DIAGNÓSTICO DE ESTADO ACTUAL:");
console.log("-----------------------------------");

const token = process.env.MERCADOPAGO_ACCESS_TOKEN || "NO DEFINIDO";
const email = process.env.TEST_PAYER_EMAIL || "NO DEFINIDO";

console.log(`TOKEN: ${token.substring(0, 10)}... (Longitud: ${token.length})`);
console.log(`PAYER: ${email}`);

if (token.startsWith("TEST-")) {
    console.log("✅ TIPO TOKEN: SANDBOX (Test)");
} else if (token.startsWith("APP_USR-")) {
    console.log("❌ TIPO TOKEN: PRODUCCIÓN (Real)");
} else {
    console.log("❓ TIPO TOKEN: DESCONOCIDO");
}

console.log("-----------------------------------\n");
