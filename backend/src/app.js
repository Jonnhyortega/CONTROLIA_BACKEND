import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import dailyCashRoutes from "./routes/dailyCashRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import customizationRoutes from "./routes/customizationRoutes.js"

const app = express();

// 🌐 Trust proxy - Necesario para Render, Heroku, etc.
app.set('trust proxy', 1);

// 🔐 Security headers
app.use(helmet());

// 📦 Compression
app.use(compression());

app.use((req, res, next) => {
  if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
    return next();
  }
  express.json()(req, res, next);
});
app.use(
  cors({
    origin: ["http://localhost:3000", 
      "https://controlia.com", 
      "https://controlia-software.vercel.app",
      "https://controlia.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);  
app.use(morgan("dev"));

// 🏥 Health check endpoint (sin autenticación)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Rutas protegidas
app.use("/api/users", userRoutes);
app.use("/api/products", protect, productRoutes);
app.use("/api/sales", protect, saleRoutes);
app.use("/api/clients", protect, clientRoutes);
app.use("/api/suppliers", protect, supplierRoutes);
app.use("/api/daily-cash", protect, dailyCashRoutes);
app.use("/api/customization", protect, customizationRoutes)
app.use("/api/admin", userManagementRoutes);

// Middlewares de error
app.use(notFound);
app.use(errorHandler);

export default app;
