import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./src/config/db_temp.js";
import User from "./src/models/User.js";
import Product from "./src/models/Product.js";
import Client from "./src/models/Client.js";
import Sale from "./src/models/Sale.js";
import Supplier from "./src/models/Supplier.js";
import DailySale from "./src/models/DailySale.js"; // ⚡ nuevo modelo
import { getLocalMidnightUTC } from "../utils/dateUtils.js";

dotenv.config();

await connectDB();

try {
  console.log("🧹 Limpiando colecciones...");
  await Promise.all([
    Product.deleteMany(),
    Client.deleteMany(),
    Sale.deleteMany(),
    Supplier.deleteMany(),
    DailySale.deleteMany(), // 🧹 limpiar ventas diarias también
  ]);

  // 🔍 Buscar usuario principal
  const user = await User.findOne({ email: "jonathan@controlia.com" });
  if (!user) throw new Error("❌ No se encontró el usuario Jonathan");

  console.log("👤 Usuario encontrado:", user.email);

  // 🛒 Crear productos
  const products = await Product.insertMany([
    {
      name: "Coca-Cola 500ml",
      category: "Bebidas",
      price: 1200,
      cost: 800,
      stock: 40,
      barcode: "CC500",
      description: "Refresco clásico",
      user: user._id,
    },
    {
      name: "Papas Lays 100g",
      category: "Snacks",
      price: 900,
      cost: 500,
      stock: 60,
      barcode: "LY100",
      description: "Papas fritas saladas",
      user: user._id,
    },
  ]);

  // 👥 Crear clientes
  const clients = await Client.insertMany([
    {
      name: "Carlos Pérez",
      phone: "1123456789",
      email: "carlos@gmail.com",
      address: "Av. Corrientes 1234",
      user: user._id,
    },
    {
      name: "Lucía Gómez",
      phone: "1198765432",
      email: "lucia@gmail.com",
      address: "Av. Rivadavia 4567",
      user: user._id,
    },
  ]);

  // 🚚 Crear proveedor
  const supplier = await Supplier.create({
    name: "Distribuidora Norte",
    phone: "1144445555",
    email: "ventas@distribuidoranorte.com",
    address: "San Martín 3000",
    debt: 0,
    user: user._id,
  });

  // 🧾 Crear ventas del día
  const sales = await Sale.insertMany([
    {
      user: user._id,
      products: [
        { product: products[0]._id, quantity: 2, price: products[0].price },
        { product: products[1]._id, quantity: 1, price: products[1].price },
      ],
      total: products[0].price * 2 + products[1].price,
      paymentMethod: "efectivo",
    },
    {
      user: user._id,
      products: [{ product: products[1]._id, quantity: 3, price: products[1].price }],
      total: products[1].price * 3,
      paymentMethod: "mercado pago",
    },
  ]);

  // 📆 Crear registro DailySale del día

const today = getLocalMidnightUTC();


  const dailySale = await DailySale.create({
    date: today,
    totalSalesAmount: sales.reduce((acc, s) => acc + s.total, 0),
    totalOperations: sales.length,
    sales: sales.map((s) => s._id),
  });

  console.log("✅ Datos generados correctamente:");
  console.table({
    Productos: products.length,
    Clientes: clients.length,
    Proveedores: 1,
    Ventas: sales.length,
    TotalDiario: `$${dailySale.totalSalesAmount}`,
  });

  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.error("❌ Error al generar datos:", error);
  await mongoose.connection.close();
  process.exit(1);
}
