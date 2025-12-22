
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preference = new Preference(client);

async function testCompatibility() {
    console.log("🔍 Testing Basic Preference Compatibility...");
    console.log("Token:", process.env.MERCADOPAGO_ACCESS_TOKEN ? process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 10) + "..." : "NONE");
    console.log("Payer:", process.env.TEST_PAYER_EMAIL);

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        title: 'Test Item',
                        quantity: 1,
                        unit_price: 10
                    }
                ],
                payer: {
                    email: process.env.TEST_PAYER_EMAIL
                }
            }
        });
        console.log("✅ SUCCESS: Preference created!");
        console.log("Link:", result.init_point);
        console.log("\nCONCLUSION: The Token and Payer ARE compatible for standard payments.");
        console.log("The issue is likely specific to SUBSCRIPTIONS (PreApproval) restrictions.");
    } catch (error) {
        console.log("❌ FAILURE creating Preference.");
        console.log("Status:", error.status);
        if (error.message) console.log("Msg:", error.message);
        
        if (JSON.stringify(error).includes("Both payer and collector")) {
            console.log("\nCONCLUSION: The Token and Payer are FUNDAMENTALLY INCOMPATIBLE.");
            console.log("This Seller Token cannot transact with this Payer Email.");
        }
    }
}

testCompatibility();
