import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
    console.error("No access token found in .env");
    process.exit(1);
}

const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/test',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const user = JSON.parse(data);
            console.log("\n✅ USUARIO DE PRUEBA (COMPRADOR) CREADO EXITOSAMENTE");
            console.log("-----------------------------------------------------");
            console.log(`EMAIL:    ${user.email}`);
            console.log(`PASSWORD: ${user.password}`);
            console.log("-----------------------------------------------------");
            console.log("Instrucciones:");
            console.log("1. Abre el link de pago en una ventana de INCÓGNITO.");
            console.log("2. Inicia sesión en Mercado Pago usando ESTE email y contraseña.");
            console.log("3. (Importante) Asegúrate de que tu aplicación esté enviando este mismo email en la preferencia de pago si es requerida.");
        } else {
            console.error("Error creating test user:", res.statusCode, data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
    site_id: "MLA",
    description: "Buyer Test User"
}));

req.end();
