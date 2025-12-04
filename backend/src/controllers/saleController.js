import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import DailyCash from "../models/DailyCash.js";
import { getLocalDayRangeUTC } from "../utils/dateHelpers.js";

/* ==========================================================
   🟢 CREAR VENTA (corrigido a horario local)
========================================================== */
export const createSale = async (req, res) => {
  try {
    const { products, total, paymentMethod } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Debe incluir al menos un producto." });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: "El total debe ser mayor a cero." });
    }

    // 🧹 Normalizar productos (acepta productos manuales tipo “otro”)
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
    // ⚠️ STOCK: validar y decrementar antes de crear venta
    // ---------------------------
    // Preparar lista de productos con product id (ignorar manuales)
    const itemsToUpdate = cleanProducts
      .filter((p) => p.product)
      .map((p) => ({ id: p.product, qty: Number(p.quantity) || 0 }));

    // verificar stock disponible
    if (itemsToUpdate.length > 0) {
      // cargar productos actuales
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

      // ahora decrementar uno a uno usando una actualización condicionada (stock >= qty)
      const updated = [];
      try {
        for (const it of itemsToUpdate) {
          const modified = await Product.findOneAndUpdate(
            { _id: it.id, stock: { $gte: it.qty } },
            { $inc: { stock: -it.qty } },
            { new: true }
          );

          if (!modified) {
            // fallo — intentar rollback de los modificados previos
            for (const done of updated) {
              try {
                await Product.findByIdAndUpdate(done.id, { $inc: { stock: done.qty } });
              } catch (rbErr) {
                console.error("Error rollback stock:", rbErr);
              }
            }
            return res.status(400).json({ message: `No hay stock suficiente para el producto ${it.id} al intentar reservar.` });
          }

          updated.push({ id: it.id, qty: it.qty });
          console.log(`Stock actualizado: product=${it.id} - decremento=${it.qty} -> restante=${modified.stock}`);
        }
      } catch (err) {
        // rollback si algo falló
        for (const done of updated) {
          try {
            await Product.findByIdAndUpdate(done.id, { $inc: { stock: done.qty } });
          } catch (rbErr) {
            console.error("Error rollback stock (catch):", rbErr);
          }
        }
        throw err;
      }
    }

    // ✅ Crear la venta (el stock ya fue reservado)
    const newSale = await Sale.create({
      user: req.user._id,
      products: cleanProducts,
      total,
      paymentMethod,
      status: "active",
    });

    // 📅 Calcular el rango UTC equivalente al día local (Argentina)
    const { start, end } = getLocalDayRangeUTC(new Date());

    // ✅ Buscar o crear DailyCash del día correcto
    const dailyCash = await DailyCash.findOneAndUpdate(
      {
        user: req.user._id,
        date: { $gte: start, $lte: end },
      },
      {
        $setOnInsert: {
          user: req.user._id,
          date: start, // inicio del día local (en UTC)
          status: "abierta",
        },
        $push: { sales: newSale._id },
        $inc: {
          totalSalesAmount: total,
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
    const sales = await Sale.find({ user: req.user._id })
      .populate("user", "name email")
      .populate("products.product", "name price");

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================
   🔍 OBTENER VENTA POR ID
========================================================== */
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user._id,
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

    // 🔹 Buscar venta
    const sale = await Sale.findOne({ _id: id, user: req.user._id }).populate(
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
    }

    // 🔹 Actualizar estado de venta
    sale.status = "reverted";
    await sale.save();

    // 🕓 Obtener rango UTC del día local en que se generó la venta
    const saleDate = new Date(sale.createdAt);
    const { start, end } = getLocalDayRangeUTC(saleDate);

    // 🔹 Buscar caja correspondiente
    const dailyCash = await DailyCash.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (dailyCash) {
      // 🔹 Actualizar totales
      dailyCash.totalSalesAmount = Math.max(
        0,
        (dailyCash.totalSalesAmount || 0) - sale.total
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
