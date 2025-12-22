
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("--- DIAGNOSTICO DE VARIABLES DE ENTORNO ---");
const token = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
console.log("TOKEN LENGTH:", token.length);
console.log("TOKEN PREFIX:", token.substring(0, 10));
console.log("TEST EMAIL:", process.env.TEST_PAYER_EMAIL);

if (token.startsWith("APP_USR-")) {
    console.log("\n⚠️ ALERTA: Estás usando un token 'APP_USR-' (Producción).");
    console.log("   Para pruebas de desarrollo, esto suele causar problemas de permisos (401) o Sandbox.");
    console.log("   Se RECOMIENDA usar el token 'TEST-' de las Credenciales de Prueba.");
} else if (token.startsWith("TEST-")) {
    console.log("\n✅ OK: Estás usando un token 'TEST-' (Sandbox).");
} else {
    console.log("\n❌ ERROR: El token tiene un formato desconocido.");
}
