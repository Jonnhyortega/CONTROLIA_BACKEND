
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preApproval = new PreApproval(client);

// User info from screenshot
const USERNAME = "TESTUSER1701326323429003527";
const USER_ID = "3085795910";

// Candidates to test
const emails = [
    `test_user_${USER_ID}@testuser.com`,        // Format 1: test_user_ID@testuser.com
    `${USERNAME}@testuser.com`,                 // Format 2: USERNAME@testuser.com
    `test_user_${USERNAME}@testuser.com`,       // Format 3: Current Guess
    USERNAME.toLowerCase() + "@testuser.com"    // Format 4: Lowercase username
];

async function testEmails() {
    console.log("🔍 TESTING EMAIL FORMATS FOR COMPATIBILITY...\n");
    
    for (const email of emails) {
        console.log(`👉 Testing: ${email}`);
        
        try {
            await preApproval.create({
                body: {
                    reason: "Test Subscription",
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: "months",
                        transaction_amount: 10,
                        currency_id: "ARS"
                    },
                    back_url: "https://google.com",
                    payer_email: email,
                    status: "pending"
                }
            });
            console.log("✅ SUCCESS! This email works.");
            console.log(`📢 UPDATE YOUR .ENV WITH: TEST_PAYER_EMAIL=${email}`);
            return;
        } catch (error) {
            console.log(`❌ Failed. Status: ${error.status}`);
            // console.log("   Msg:", error.message); 
            if (error.message) console.log("   Msg:", error.message);
        }
        console.log("-------------------");
    }
    console.log("\n⚠️ No email format worked. Valid Test User needed.");
}

testEmails();
