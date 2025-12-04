import Supplier from "../models/Supplier.js";


export const createSupplier = async (req, res) => {
try {
const supplier = await Supplier.create({ ...req.body, user: req.user._id });
res.status(201).json(supplier);
} catch (error) {
res.status(500).json({ message: error.message });
}
};


export const getSuppliers = async (req, res) => {
try {
const suppliers = await Supplier.find({ user: req.user._id }).sort({ createdAt: -1 });
res.json(suppliers);
} catch (error) {
res.status(500).json({ message: error.message });
}
};


export const updateSupplier = async (req, res) => {
try {
const supplier = await Supplier.findOneAndUpdate(
{ _id: req.params.id, user: req.user._id },
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
const supplier = await Supplier.findOne({ _id: req.params.id, user: req.user._id });
if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });


await supplier.deleteOne();
res.json({ message: "Proveedor eliminado correctamente" });
} catch (error) {
res.status(500).json({ message: error.message });
}
};