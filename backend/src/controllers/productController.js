import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import ProductHistory from "../models/ProductHistory.js";

// CREAR PRODUCTO
export const createProduct = async (req, res) => {
  console.log("📦 Body recibido:", req.body);

  try {
    const { name, category, price, cost, stock, barcode, description, supplier } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    // 🚫 Verificar duplicado
    const ownerId = req.user.createdBy || req.user._id;

    if (barcode) {
      const productExists = await Product.findOne({ barcode, user: ownerId });
      if (productExists) {
        return res.status(400).json({ message: "El producto ya existe." });
      }
    }

    // ✅ Validar y guardar proveedor
    let supplierRef = null;
    if (supplier) {
      const supplierExists = await Supplier.findOne({ _id: supplier, user: ownerId });
      if (!supplierExists) {
        return res.status(404).json({ message: "Proveedor no encontrado." });
      }
      supplierRef = supplierExists._id;
    }

    // ✅ Crear producto con proveedor si existe
    const product = await Product.create({
      name,
      category: category || "Otros",
      price,
      cost: cost || 0,
      stock: stock || 0,
      barcode: barcode || null,
      description,
      supplier: supplierRef,
      user: ownerId,
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
    const ownerId = req.user.createdBy || req.user._id;
    const products = await Product.find({ user: ownerId })
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
    const ownerId = req.user.createdBy || req.user._id;
    const product = await Product.findOne({ _id: req.params.id, user: ownerId });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    };
    
// ACTUALIZAR PRODUCTO
export const updateProduct = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const product = await Product.findOne({ _id: req.params.id, user: ownerId }); // Buscamos en el dueño
    
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    // 🕵️ Detectar cambios para historial
    const changes = {};
    let hasChanges = false;
    
    const fieldsToCheck = ["name", "price", "cost", "stock", "category", "barcode", "description"];

    fieldsToCheck.forEach(field => {
      // Comparación laxa (!=) para evitar falsos positivos por tipos
      if (req.body[field] !== undefined && req.body[field] != product[field]) {
         changes[field] = {
           old: product[field],
           new: req.body[field]
         };
         hasChanges = true;
      }
    });

    // Si hubo cambios, guardamos historial
    if (hasChanges) {
      await ProductHistory.create({
        product: product._id,
        user: req.user._id, // Guardamos QUIÉN hizo el cambio (empleado o admin)
        action: "update",
        changes: changes,
        description: "Actualización de producto"
      });
    }

    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HISTORIAL DE CAMBIOS (NUEVO endpoint)
export const getProductHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.createdBy || req.user._id;

    // Verificar que el producto pertenece al dueño
    const product = await Product.findOne({ _id: id, user: ownerId });
    if (!product) return res.status(404).json({ message: "Producto no encontrado o no autorizado" });

    const history = await ProductHistory.find({ product: id })
      .populate("user", "name email role") // Para ver quién hizo el cambio
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
        
export const deleteProduct = async (req, res) => {
    try {
    const ownerId = req.user.createdBy || req.user._id;
    const product = await Product.findOne({ _id: req.params.id, user: ownerId });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    
    
    await product.deleteOne();
    res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    };