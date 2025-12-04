import express from "express";
import cors from "cors";
import morgan from "morgan";
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

app.use((req, res, next) => {
  if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
    return next();
  }
  express.json()(req, res, next);
});
app.use(
  cors({
    origin: ["http://localhost:3000", "https://controlia.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);  
app.use(morgan("dev"));

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
