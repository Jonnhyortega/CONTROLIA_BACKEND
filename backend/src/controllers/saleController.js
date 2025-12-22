import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import DailyCash from "../models/DailyCash.js";
import Client from "../models/Client.js"; // ✅ Importar Client
import ProductHistory from "../models/ProductHistory.js";
import User from "../models/User.js";
import { getLocalDayRangeUTC } from "../utils/dateHelpers.js";
import { PLAN_LIMITS, ERROR_MESSAGES } from "../config/planLimits.js";

/* ==========================================================
   🟢 CREAR VENTA (corrigido a horario local)
========================================================== */
export const createSale = async (req, res) => {
  try {
    // 1. Sanitizar inputs explícitamente a Números
    let { products, total, paymentMethod, clientId, amountPaid } = req.body;
    
    // 🛡️ LIMITES (Operaciones Mensuales)
    const ownerId = req.user.createdBy || req.user._id;
    const owner = await User.findById(ownerId).select("membershipTier");
    const tier = owner?.membershipTier || "basic";
    const limit = PLAN_LIMITS[tier]?.monthlySales || 300;

    // Calcular inicio de mes actual
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentSales = await Sale.countDocuments({ 
        user: ownerId,
        createdAt: { $gte: startOfMonthDate }
    });

    if (currentSales >= limit) {
        return res.status(403).json({ 
            message: `${ERROR_MESSAGES.monthlySales} (${currentSales}/${limit})` 
        });
    }
    
    const numericTotal = Number(total);
    const numericAmountPaid = (amountPaid !== undefined && amountPaid !== null) ? Number(amountPaid) : undefined;

    // console.log("💰 Processing Sale:", { numericTotal, numericAmountPaid, paymentMethod });

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Debe incluir al menos un producto." });
    }

    if (isNaN(numericTotal) || numericTotal <= 0) {
      return res.status(400).json({ message: "El total debe ser un número mayor a cero." });
    }

    // 🧹 Normalizar productos
    const cleanProducts = products.map((p) => {
      const hasProductId = p.product && p.product !== "otro";
      return {
        product: hasProductId ? p.product : null,
        name: hasProductId ? null : (p.name?.trim() || "Producto sin nombre"),
        quantity: Number(p.quantity) || 1,
        price: Number(p.price) || 0,
      };
    });

    // ---------------------------
    // ⚠️ STOCK: validar y decrementar
    // ---------------------------
    const itemsToUpdate = cleanProducts
      .filter((p) => p.product)
      .map((p) => ({ id: p.product, qty: Number(p.quantity) || 0 }));

    if (itemsToUpdate.length > 0) {
      const dbProducts = await Product.find({ _id: { $in: itemsToUpdate.map((i) => i.id) } });

      for (const it of itemsToUpdate) {
        const db = dbProducts.find((d) => d._id.toString() === it.id.toString());
        if (!db) {
          return res.status(404).json({ message: `Producto ${it.id} no encontrado` });
        }
        if (typeof db.stock === "number" && db.stock < it.qty) {
          return res.status(400).json({ message: `Stock insuficiente para ${db.name || db._id}. Disponible: ${db.stock}, pedido: ${it.qty}` });
        }
      }

      const updated = [];
      try {
        for (const it of itemsToUpdate) {
          const modified = await Product.findOneAndUpdate(
            { _id: it.id, stock: { $gte: it.qty } },
            { $inc: { stock: -it.qty } },
            { new: true }
          );

          if (!modified) {
             // Rollback logic
            for (const done of updated) {
              await Product.findByIdAndUpdate(done.id, { $inc: { stock: done.qty } }).catch(console.error);
            }
            return res.status(400).json({ message: `No hay stock suficiente para el producto ${it.id} al intentar reservar.` });
          }

          updated.push({ id: it.id, qty: it.qty });
          
          await ProductHistory.create({
            product: it.id,
            user: req.user._id,
            action: "stock_adjustment",
            changes: {
              stock: {
                old: modified.stock + it.qty,
                new: modified.stock
              }
            },
            description: "Venta realizada" 
          });
        }
      } catch (err) {
        // Full rollback
        for (const done of updated) {
           await Product.findByIdAndUpdate(done.id, { $inc: { stock: done.qty } }).catch(console.error);
        }
        throw err;
      }
    }

    // ---------------------------
    // 💰 PAGOS PARCIALES - Lógica Blindada
    // ---------------------------
    let finalAmountPaid = numericTotal;
    let finalAmountDebt = 0;

    // Si se envió un pago parcial explícito, usémoslo
    if (numericAmountPaid !== undefined && !isNaN(numericAmountPaid)) {
        finalAmountPaid = numericAmountPaid;
        
        // Sanity checks
        if (finalAmountPaid < 0) finalAmountPaid = 0;
        
        // Normalmente no permitimos pagar más del total, pero si lo hacen, es cambio.
        // Asumimos lógica estándar: pago no puede "cubrir más" que la deuda.
        if (finalAmountPaid > numericTotal) finalAmountPaid = numericTotal;
    }

    finalAmountDebt = numericTotal - finalAmountPaid;

    // Si hay deuda, actualizar cliente
    if (finalAmountDebt > 0) {
      if (!clientId) {
        return res.status(400).json({ message: "Para dejar deuda (cuenta corriente) se requiere un cliente registrado." });
      }
      await Client.findByIdAndUpdate(clientId, { $inc: { balance: finalAmountDebt } });
    }

    // ---------------------------
    // 🔑 Multi-tenancy
    // ---------------------------
    // ownerId ya definido al inicio

    // ✅ Crear la venta
    const newSale = await Sale.create({
      user: ownerId, 
      seller: req.user._id,
      products: cleanProducts,
      total: numericTotal,
      amountPaid: finalAmountPaid, // Se guarda lo efectivamente pagado
      amountDebt: finalAmountDebt,
      paymentMethod,
      client: clientId || null,
      status: "active",
    });

    // 📅 Actualizar DailyCash
    const { start, end } = getLocalDayRangeUTC(new Date());

    const dailyCash = await DailyCash.findOneAndUpdate(
      {
        user: ownerId,
        date: { $gte: start, $lte: end },
      },
      {
        $setOnInsert: {
          user: ownerId,
          date: start,
          status: "abierta",
        },
        $push: { sales: newSale._id },
        $inc: {
          totalSalesAmount: finalAmountPaid, // ✅ SUMAR LO PAGADO, NO EL TOTAL
          totalOperations: 1,
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      success: true,
      message: "✅ Venta registrada correctamente.",
      sale: newSale,
      dailyCash,
    });
  } catch (error) {
    console.error("❌ Error al registrar venta:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar venta.",
      error: error.message,
    });
  }
};

/* ==========================================================
   📋 LISTAR TODAS LAS VENTAS
========================================================== */
export const getSales = async (req, res) => {
  try {
    // 🔑 Multi-tenancy: Ver ventas del dueño
    const ownerId = req.user.createdBy || req.user._id;

    // 📄 Paginación
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Contar total
    const total = await Sale.countDocuments({ user: ownerId });

    const sales = await Sale.find({ user: ownerId })
      .populate("user", "name email")
      .populate("seller", "name email")
      .populate("products.product", "name price")
      .sort({ createdAt: -1 }) // Ordenar por más reciente
      .skip(skip)
      .limit(limit);

    res.json({
      sales,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================
   🔍 OBTENER VENTA POR ID
========================================================== */
export const getSaleById = async (req, res) => {
  try {
    // 🔑 Multi-tenancy: Buscar ventas del dueño
    const ownerId = req.user.createdBy || req.user._id;

    const sale = await Sale.findOne({
      _id: req.params.id,
      user: ownerId,
    })
      .populate("user", "name email")
      .populate("products.product", "name price");

    if (!sale)
      return res.status(404).json({ message: "Venta no encontrada" });

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================
   🔴 REVERTIR VENTA (corrigido a horario local)
========================================================== */
export const revertSale = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("🧾 Revirtiendo venta ID:", id);

    // 🔑 Multi-tenancy: Revertir venta del dueño
    const ownerId = req.user.createdBy || req.user._id;

    // 🔹 Buscar venta
    const sale = await Sale.findOne({ _id: id, user: ownerId }).populate(
      "products.product"
    );

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }

    // 🔹 Verificar estado
    if (sale.status === "reverted") {
      return res.status(200).json({
        message: "⚠️ La venta ya estaba revertida previamente.",
        alreadyReverted: true,
      });
    }

    // 🔹 Revertir stock (solo productos válidos)
    for (const item of sale.products) {
      const productId = item.product?._id || item.product;
      if (!productId) continue;

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: item.quantity } },
        { new: true }
      );

      // 📝 Registrar en historial de producto (Reversión)
      const currentStock = await Product.findById(productId).select("stock");
      await ProductHistory.create({
            product: productId,
            user: req.user._id, // User que ejecutó la acción (auditoría)
            action: "stock_adjustment",
            changes: {
              stock: {
                // Como ya se incrementó, el old era stock - quantity
                old: currentStock.stock - item.quantity,
                new: currentStock.stock
              }
            },
            description: `Venta revertida (${sale._id})` 
      });
    }

    // 🔹 Actualizar estado de venta
    sale.status = "reverted";
    await sale.save();

    // 🕓 Obtener rango UTC del día local en que se generó la venta
    const saleDate = new Date(sale.createdAt);
    const { start, end } = getLocalDayRangeUTC(saleDate);

    // 🔹 Buscar caja correspondiente
    const dailyCash = await DailyCash.findOne({
      user: ownerId, // <--- Caja del dueño
      date: { $gte: start, $lte: end },
    });

    if (dailyCash) {
      // 🔹 Actualizar totales
      let deductedAmount = sale.amountPaid || 0;
      // Compatibilidad: Si es venta vieja, amountPaid y Debt son 0 -> descontar total
      if (deductedAmount === 0 && (sale.amountDebt || 0) === 0 && sale.total > 0) {
        deductedAmount = sale.total;
      }

      dailyCash.totalSalesAmount = Math.max(
        0,
        (dailyCash.totalSalesAmount || 0) - deductedAmount
      );
      dailyCash.totalOperations = Math.max(
        0,
        (dailyCash.totalOperations || 1) - 1
      );
      dailyCash.sales = dailyCash.sales.filter(
        (s) => s.toString() !== sale._id.toString()
      );
      await dailyCash.save();
    } else {
      console.warn("⚠️ No se encontró DailyCash para la fecha de la venta.");
    }

    return res.status(200).json({
      message: "✅ Venta revertida correctamente.",
      revertedSale: sale._id,
      updatedDailyCash: dailyCash?._id || null,
    });
  } catch (err) {
    console.error("❌ Error en revertSale:", err);
    return res.status(500).json({
      message: "Error interno al revertir la venta.",
      error: err.message,
    });
  }
};
