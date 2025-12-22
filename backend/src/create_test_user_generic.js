
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

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const user = JSON.parse(data);
            console.log("✅ NEW TEST USER CREATED:");
            console.log("Email:", user.email);
            console.log("Password:", user.password); // Sometimes returned
            console.log("Site ID:", user.site_id);
            console.log("\nINSTRUCTIONS:");
            console.log(`Update .env TEST_PAYER_EMAIL=${user.email}`);
        } else {
            console.error("Failed to create test user:", res.statusCode, data);
        }
    });
});

req.write(JSON.stringify({
    site_id: "MLA",
    description: "wallet"
}));

req.end();
