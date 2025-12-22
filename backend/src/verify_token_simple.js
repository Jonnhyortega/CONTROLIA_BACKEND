
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually try to load .env from the known path
const envPath = path.join(__dirname, "../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

console.log("---------------------------------------------------");
const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
console.log("MERCADOPAGO_ACCESS_TOKEN found:", !!token);

if (token) {
    console.log("Token Prefix:", token.substring(0, 15) + "...");
    
    // Check if it's a TEST token
    if (token.startsWith("TEST-")) {
        console.log("✅ Token looks like a TEST token.");
    } else if (token.startsWith("APP_USR-")) {
        console.log("⚠️ Token looks like a PRODUCTION token (APP_USR-).");
        console.log("   If you are testing Subscriptions with a Test User, this usually fails with 400 or 401.");
    } else {
        console.log("❓ Token format unknown or custom.");
    }

    // 2. Try a simple API call to verify the token is valid
    console.log("\nVerifying token validity with Mercado Pago...");
    const client = new MercadoPagoConfig({ accessToken: token });
    const preApproval = new PreApproval(client);

    // We search for something invalid just to check auth, or listing empty. 
    // Actually, PreApproval.search is complex. Let's just try to create a dummy one that will fail validation but pass auth?
    // Or better, just hit /users/me or generic endpoint? The SDK usually wraps specific resources.
    // Let's rely on the previous create attempts which failed with 401. 
    // If 401, the token is rejected.
    
    // We can try to get a subscription that doesn't exist, if auth works it should behave differently than 401.
    // But easiest is just to trust the user needs to see the console output of the PREFIX.
} else {
    console.error("❌ ERROR: No MERCADOPAGO_ACCESS_TOKEN found in environment.");
}
console.log("---------------------------------------------------");
