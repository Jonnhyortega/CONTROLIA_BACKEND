import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  // console.log("🟥 protect ejecutándose");
  // console.log("🟥 Headers:", req.headers);

  let token;

  try {
    // Si viene el header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      return next(); 
    }

    return res.status(401).json({ message: "No autorizado, sin token" });

  } catch (err) {
    console.error("❌ Error en protect:", err);
    return res.status(401).json({ message: "Token no válido" });
  }
};

// ✅ Middleware adicional para rol admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else res.status(403).json({ message: "Acceso denegado: solo administradores" });
};
