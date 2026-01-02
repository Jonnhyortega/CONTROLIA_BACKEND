
import mongoose from "mongoose";
import Sale from "./models/Sale.js";
import DailyCash from "./models/DailyCash.js";
import Client from "./models/Client.js";
import Transaction from "./models/Transaction.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { getLocalDayRangeUTC } from "./utils/dateHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

const runVerification = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // 1. Setup Test Data
    const ownerId = new mongoose.Types.ObjectId();
    const userId = ownerId; // Simulating being the owner
    
    // Create Dummy User if needed (mocking req.user)
    const mockUser = { _id: userId, createdBy: null };

    // Create Dummy Client
    const client = await Client.create({
        name: "Test Client",
        user: ownerId,
        balance: 0
    });
    console.log(`👤 Cliente creado: ${client._id}`);

    // Create Dummy Product
    const product = await Product.create({
        name: "Test Product",
        price: 100,
        cost: 50,
        stock: 10,
        user: ownerId
    });

    // 2. Simulate Create Sale (Controller Logic Adaptation)
    console.log("\n--- Simulating Create Sale (Fiado) ---");
    const saleData = {
        products: [{ product: product._id, quantity: 1, price: 100 }],
        total: 100,
        amountPaid: 0,
        paymentMethod: "cuenta corriente",
        clientId: client._id
    };

    // ... Logic from createSale ...
    const numericTotal = 100;
    const finalAmountPaid = 0;
    const finalAmountDebt = 100;

    // A. Update Client & Create Transaction
    await Client.findByIdAndUpdate(client._id, { $inc: { balance: finalAmountDebt } });
    await Transaction.create({
        type: "CLIENT_DEBT",
        amount: finalAmountDebt,
        client: client._id,
        description: "Deuda por venta (Fiado) TEST",
        user: ownerId,
        createdBy: userId,
        date: new Date()
    });

    // B. Create Sale
    const newSale = await Sale.create({
        user: ownerId, 
        seller: userId,
        products: [{ product: product._id, quantity: 1, price: 100 }],
        total: numericTotal,
        amountPaid: finalAmountPaid, 
        amountDebt: finalAmountDebt,
        paymentMethod: "cuenta corriente",
        client: client._id,
        status: "active",
    });
    console.log(`💰 Sale Created: ${newSale._id}`);

    // C. Update DailyCash
    const { start, end } = getLocalDayRangeUTC(new Date());
    const dailyCash = await DailyCash.findOneAndUpdate(
        { user: ownerId, date: { $gte: start, $lte: end } },
        { 
            $setOnInsert: { user: ownerId, date: start, status: "abierta" },
            $push: { sales: newSale._id },
            $inc: { totalSalesAmount: finalAmountPaid, totalOperations: 1 }
        },
        { new: true, upsert: true }
    );
    console.log(`📅 DailyCash updated: ${dailyCash._id} | Sales Count: ${dailyCash.sales.length}`);

    // --- VERIFICATION 1 ---
    const updatedClient = await Client.findById(client._id);
    const debtTx = await Transaction.findOne({ client: client._id, type: "CLIENT_DEBT", amount: 100 });
    
    console.log(`🧐 Verification 1 (After Create):`);
    console.log(`   Client Balance: ${updatedClient.balance} (Expected 100)`);
    console.log(`   Debt Transaction Exists: ${!!debtTx}`);

    // 3. Simulate Revert Sale (Controller Logic Adaptation)
    console.log("\n--- Simulating Revert Sale ---");
    
    // A. Revert Stock (Skipping for brevity)

    // B. Revert Debt (The Fix)
    if (newSale.amountDebt > 0) {
        await Client.findByIdAndUpdate(newSale.client, { $inc: { balance: -newSale.amountDebt } });
        await Transaction.create({
            type: "CLIENT_DEBT",
            amount: -newSale.amountDebt,
            client: newSale.client,
            description: `Anulación de venta TEST ${newSale._id}`,
            user: ownerId,
            createdBy: userId,
            date: new Date()
        });
    }

    // C. Update Status
    newSale.status = "reverted";
    await newSale.save();

    // D. Remove from DailyCash
    const saleDate = new Date(newSale.createdAt);
    const range = getLocalDayRangeUTC(saleDate);

    const targetDailyCash = await DailyCash.findOne({
        user: ownerId, 
        date: { $gte: range.start, $lte: range.end },
    });
    
    if (targetDailyCash) {
        const initialCount = targetDailyCash.sales.length;
        targetDailyCash.sales = targetDailyCash.sales.filter(s => s.toString() !== newSale._id.toString());
        await targetDailyCash.save();
        console.log(`📅 DailyCash cleaned. Sales before: ${initialCount}, after: ${targetDailyCash.sales.length}`);
    } else {
        console.log("❌ DailyCash NOT FOUND for revert!");
    }

    // --- VERIFICATION 2 ---
    const revertedClient = await Client.findById(client._id);
    const revertTx = await Transaction.findOne({ client: client._id, type: "CLIENT_DEBT", amount: -100 });
    const finalDailyCash = await DailyCash.findById(dailyCash._id);
    
    console.log(`🧐 Verification 2 (After Revert):`);
    console.log(`   Client Balance: ${revertedClient.balance} (Expected 0)`);
    console.log(`   Revert Transaction Exists: ${!!revertTx}`);
    console.log(`   Sale in DailyCash: ${finalDailyCash.sales.includes(newSale._id)} (Expected false)`);

    // CLEANUP
    console.log("\n🧹 Cleaning up test data...");
    await Client.deleteOne({ _id: client._id });
    await Sale.deleteOne({ _id: newSale._id });
    await DailyCash.deleteOne({ _id: dailyCash._id });
    await Transaction.deleteMany({ client: client._id }); // Delete both tx
    await Product.deleteOne({ _id: product._id });

    console.log("Done.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

runVerification();
