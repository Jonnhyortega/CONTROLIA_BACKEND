import Customization from "../models/Customization.js";

// 🟦 Obtener configuración actual
export const getCustomization = async (req, res) => {
  const data = await Customization.findOne({ user: req.user._id });
  if (!data) {
    const created = await Customization.create({ user: req.user._id });
    return res.json(created);
  }
  res.json(data);
};

// 🟩 Actualizar texto simple (negocio, color primario, etc.)
export const updateCustomization = async (req, res) => {
  const updated = await Customization.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true }
  );
  res.json(updated);
};

// 🟪 Subir logo
export const uploadLogoController = async (req, res) => {

  console.log("📸 File recibido:", req.file); // <-- AGREGAR ESTO
  console.log("📸 Path:", req.file?.path);
  
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }

    const logoUrl = req.file.path; // URL final de Cloudinary

    // acá guardás en la colección "Customization" de tu usuario
    // por ejemplo:
    // await Customization.findOneAndUpdate(
    //   { user: req.user._id },
    //   { logoUrl },
    //   { new: true, upsert: true }
    // );

    res.json({
      message: "Logo actualizado correctamente",
      url: logoUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Error al subir logo", error: err.message });
  }
};


// 🔄 Restaurar valores por defecto
export const resetCustomization = async (req, res) => {
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
