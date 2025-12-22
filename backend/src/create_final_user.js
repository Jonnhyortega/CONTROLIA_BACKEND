
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

// INTENTO FINAL: Crear un usuario usando EL MISMO TOKEN de vendedor.
// Esto garantiza compatibilidad de Sandbox.
const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/test_user',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const user = JSON.parse(data);
            console.log("✅ NUEVO USUARIO COMPATIBLE CREADO:");
            console.log("Email:", user.email);
            console.log("Password:", user.password);
            console.log("\nINSTRUCCIONES:");
            console.log("1. Copia este Email y ponlo en tu .env (TEST_PAYER_EMAIL).");
            console.log("2. Reinicia el servidor.");
            console.log("3. Al pagar, LOGUEATE con este mismo Email y Password.");
        } else {
            console.log("❌ ERROR AL CREAR USUARIO AUTOMATICO:", res.statusCode, data);
            
            // Fallback strategy: Suggest the user manually creates one if this fails
            console.log("\nSi esto falla, verifica que tu Access Token 'TEST-' tenga permisos de 'read write'.");
        }
    });
});

req.write(JSON.stringify({
    site_id: "MLA",
    description: "wallet"
}));

req.end();
