import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";

// CREAR PRODUCTO
export const createProduct = async (req, res) => {
  console.log("📦 Body recibido:", req.body);

  try {
    const { name, category, price, cost, stock, barcode, description, supplier } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    // 🚫 Verificar duplicado
    if (barcode) {
      const productExists = await Product.findOne({ barcode, user: req.user._id });
      if (productExists) {
        return res.status(400).json({ message: "El producto ya existe." });
      }
    }

    // ✅ Validar y guardar proveedor
    let supplierRef = null;
    if (supplier) {
      const supplierExists = await Supplier.findOne({ _id: supplier, user: req.user._id });
      if (!supplierExists) {
        return res.status(404).json({ message: "Proveedor no encontrado." });
      }
      supplierRef = supplierExists._id;
    }

    // ✅ Crear producto con proveedor si existe
    const product = await Product.create({
      name,
      category,
      price,
      cost: cost || 0,
      stock: stock || 0,
      barcode: barcode || null,
      description,
      supplier: supplierRef,
      user: req.user._id,
    });

    // 👇 Importante: devolvemos el producto populado
    const populatedProduct = await Product.findById(product._id).populate("supplier", "name");
    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    res.status(500).json({ message: error.message });
  }
};

// OBTENER TODOS LOS PRODUCTOS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id })
      .populate("supplier", "name phone email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OBTENER PRODUCTO POR ID
export const getProductById = async (req, res) => {
    try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    };
    
// ACTUALIZAR PRODUCTO
export const updateProduct = async (req, res) => {
    try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    
    
    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    };
    
    
export const deleteProduct = async (req, res) => {
    try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    
    
    await product.deleteOne();
    res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    };