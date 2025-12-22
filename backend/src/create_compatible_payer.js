
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
    path: '/v1/customers', // Try verifying creating a customer associated with THIS seller
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
};

// Creating a Customer in the Seller's contact list
const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const customer = JSON.parse(data);
            console.log("✅ New Customer Created Associated with Seller:");
            console.log("Email:", customer.email);
            console.log("ID:", customer.id);
            console.log("\nINSTRUCTIONS:");
            console.log("Please update your .env with this email:");
            console.log(`TEST_PAYER_EMAIL=${customer.email}`);
        } else {
            console.error("Failed to create customer:", res.statusCode, data);
            
            // Fallback: Try generic test user creation endpoint if above fails
            // createGenericTestUser();
        }
    });
});

req.write(JSON.stringify({
    email: `test_payer_${Date.now()}@testuser.com`,
    first_name: "Test",
    last_name: "Payer"
}));
req.end();
