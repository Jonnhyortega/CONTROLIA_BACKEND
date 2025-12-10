import Customization from "../models/Customization.js";
import User from "../models/User.js";

// 🟦 Obtener configuración actual
export const getCustomization = async (req, res) => {
  // 🔑 Multi-tenancy: Si soy empleado, veo la config del dueño
  const ownerId = req.user.createdBy || req.user._id;

  const data = await Customization.findOne({ user: ownerId });
  
  // Si no existe, y soy el dueño (admin), crearla por defecto.
  // Si soy empleado y no existe, devolver null o defaults pero SIN crear en DB bajo el ID del empleado.
  if (!data) {
    if (req.user.role === "admin") {
         const created = await Customization.create({ user: req.user._id });
         return res.json(created);
    } else {
        // Retornar defaults en memoria sin persistir
         return res.json({
            businessName: "Mi Comercio",
            logoUrl: "",
            primaryColor: "#2563eb",
            theme: "dark",
            currency: "ARS" 
         });
    }
  }
  res.json(data);
};

// Importar User al inicio del archivo si no está (lo agregaré en el replace bloque)

// 🟩 Actualizar texto simple (negocio, color primario, etc.)
export const updateCustomization = async (req, res) => {
  // Solo admin
  if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Solo el administrador puede editar la personalización." });
  }

  const { businessName } = req.body;

  // 1. Actualizar Customization
  const updated = await Customization.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, upsert: true } // Upsert por si no existía
  );

  // 2. Si cambiaron el nombre del negocio, sincronizar con User
  if (businessName) {
      await User.findByIdAndUpdate(req.user._id, { businessName });
  }

  res.json(updated);
};

// 🟪 Subir logo
export const uploadLogoController = async (req, res) => {

  console.log("📸 File recibido:", req.file);
  
  try {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }

    const logoUrl = req.file.path; // URL final de Cloudinary

    // ✅ Guardar en la DB
    await Customization.findOneAndUpdate(
      { user: req.user._id },
      { logoUrl },
      { new: true, upsert: true }
    );

    res.json({
      message: "Logo actualizado correctamente",
      url: logoUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al subir logo", error: err.message });
  }
};


// 🔄 Restaurar valores por defecto
export const resetCustomization = async (req, res) => {
  if (req.user.role !== "admin") {
     return res.status(403).json({ message: "No autorizado" });
  }

  const defaults = {
    businessName: "Mi Comercio",
    logoUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    theme: "dark",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "HH:mm",
  };

  const updated = await Customization.findOneAndUpdate(
    { user: req.user._id },
    defaults,
    { new: true }
  );

  res.json(updated);
};
