
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
    console.error("No Access Token found.");
    process.exit(1);
}

console.log("Inspecting Account for Token:", accessToken.substring(0, 15) + "...");

const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/me',
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
            console.log("\n------------------------------------------------");
            console.log("ACCOUNT DETAILS:");
            console.log("ID:", user.id);
            console.log("Nickname:", user.nickname);
            console.log("Email:", user.email);
            console.log("\nTAGS (Important):", JSON.stringify(user.tags));
            console.log("------------------------------------------------");
            
            const isTestUser = user.tags && user.tags.includes("test_user");
            if (isTestUser) {
                console.log("✅ CONCLUSION: This IS a TEST USER account.");
            } else {
                console.log("❌ CONCLUSION: This is a REAL (Production) account.");
                console.log("   (This explains why it rejects test payments if configured incorrectly)");
            }
        } else {
            console.error("Error fetching user data:", res.statusCode, data);
        }
    });
});
req.end();
