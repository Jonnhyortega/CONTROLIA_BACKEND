import Supplier from "../models/Supplier.js";


export const createSupplier = async (req, res) => {
  try {
    // Usar el ID del creador (admin) si existe, sino el del usuario actual
    const ownerId = req.user.createdBy || req.user._id;
    const supplier = await Supplier.create({ ...req.body, user: ownerId });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getSuppliers = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    // Buscar proveedores que pertenezcan al 'ownerId'
    const suppliers = await Supplier.find({ user: ownerId }).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateSupplier = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, user: ownerId }, // Asegurar que sea del dueño
      req.body,
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteSupplier = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const supplier = await Supplier.findOne({ _id: req.params.id, user: ownerId });
    if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });
    
    await supplier.deleteOne();
    res.json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};