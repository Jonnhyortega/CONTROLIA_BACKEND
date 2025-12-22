
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
// PON AQUÍ EL USUARIO QUE VEAS EN PANTALLA
const targetUser = "TESTUSER1701326323429003527"; 

if (!accessToken) {
    console.error("No access token found.");
    process.exit(1);
}

const options = {
    hostname: 'api.mercadopago.com',
    path: `/users/${targetUser}`, // Try to get details by ID/Nickname
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const user = JSON.parse(data);
            console.log("\n✅ DETALLES DEL USUARIO ENCONTRADOS:");
            console.log("-----------------------------------------");
            console.log("Nickname:", user.nickname);
            console.log("EMAIL COMPLETO:", user.email);
            console.log("-----------------------------------------");
            console.log(`Por favor, pega el EMAIL COMPLETO en tu .env como TEST_PAYER_EMAIL`);
        } else {
            // Si falla por ID, probamos buscar por search
            console.log("No se pudo obtener directo. El 'Usuario' en pantalla suele ser el nickname.");
            // Normalmente el email es test_user_{id}@testuser.com pero confirmemos.
        }
    });
});
req.end();
