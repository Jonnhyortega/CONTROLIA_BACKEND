
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/test_user',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
};

console.log("Attempting to create a compatible Test User with current token...");

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const user = JSON.parse(data);
            console.log("\n✅ SUCCESS: Compatible Test User Created!");
            console.log("Email:", user.email);
            console.log("-----------------------------------------");
            console.log("Please update .env TEST_PAYER_EMAIL with this email.");
        } else {
            console.error("❌ FAILURE:", res.statusCode, data);
            console.log("Reason: The current token might not have permissions to create test users, or is invalid.");
        }
    });
});

req.write(JSON.stringify({
    site_id: "MLA",
    description: "wallet"
}));

req.end();
