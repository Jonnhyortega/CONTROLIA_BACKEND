import DailyCash from "../models/DailyCash.js";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import { getLocalDayRangeUTC } from "../utils/dateHelpers.js";
import mongoose from "mongoose";

/* ==========================================================
   🧩 HELPER UNIFICADO (LOCAL → UTC)
========================================================== */
/**
 * Devuelve el rango UTC equivalente al día local (Argentina, UTC-3).
 * Por ejemplo, si hoy es 4/11 en Argentina, devuelve:
 * start: 2025-11-04T03:00:00.000Z
 * end:   2025-11-05T02:59:59.999Z
 */

/* ==========================================================
   🟢 OBTENER (O CREAR) LA CAJA DEL DÍA
========================================================== */
export const getTodayCash = async (req, res) => {
  console.log("📅 [DEBUG] getTodayCash ejecutado");

  try {
    // 🔑 Multi-tenancy: DailyCash pertenece al dueño
    const ownerId = req.user.createdBy || req.user._id;

    // 📆 Obtener rango del día local en UTC
    const { start, end } = getLocalDayRangeUTC(new Date());

    // 🧾 Buscar caja existente del día
    let dailyCash = await DailyCash.findOne({
      user: ownerId,
      date: { $gte: start, $lte: end },
    })
      .populate({
        path: "sales",
        populate: { path: "products.product", select: "name price cost" },
      })
      .lean();

    // 🚫 Si no existe, crearla con las ventas del día
    if (!dailyCash) {
      const sales = await Sale.find({
        user: ownerId,
        date: { $gte: start, $lte: end },
      }).populate("products.product", "name price cost");

      const totalSalesAmount = sales.reduce((sum, s) => {
        // Si existe amountPaid (ventas nuevas), usamos eso. Si no (ventas viejas), usamos total.
        const income = (s.amountPaid !== undefined && s.amountPaid !== null) ? s.amountPaid : s.total;
        return sum + (income || 0);
      }, 0);
      const totalOperations = sales.length;

      dailyCash = await DailyCash.create({
        user: ownerId,
        date: start, // Fecha base del día (inicio del rango)
        sales: sales.map((s) => s._id),
        totalSalesAmount,
        totalOperations,
        status: "abierta",
      });

      // Recargar con populate
      dailyCash = await DailyCash.findById(dailyCash._id)
        .populate({
          path: "sales",
          populate: { path: "products.product", select: "name price cost" },
        })
        .lean();
    }

    // ---------------------------------------------------
    // 🧠 AGREGAR TRANSACCIONES "CLIENT_PAYMENT" DE HOY
    // Para que el Dashboard muestre los cobros de deuda
    // ---------------------------------------------------
    let transactions = [];
    try {
        const Transaction = (await import("../models/Transaction.js")).default;
        const Client = (await import("../models/Client.js")).default; // Opcional si queremos popular nombre

        transactions = await Transaction.find({
            user: ownerId,
            type: "CLIENT_PAYMENT",
            date: { $gte: start, $lte: end }
        }).populate('client', 'name').sort({ date: -1 });

        // 🧠 AGREGAR PAGOS A PROVEEDORES COMO GASTOS
        const supplierPayments = await Transaction.find({
            user: ownerId,
            type: "SUPPLIER_PAYMENT",
            date: { $gte: start, $lte: end }
        }).populate('supplier', 'name').sort({ date: -1 });

        // Mapear a formato de gasto para el frontend
        const mappedSupplierPayments = supplierPayments.map(tx => ({
             description: `Pago a Proveedor: ${tx.supplier?.name || 'Desconocido'} - ${tx.description || 'Sin descripción'}`,
             amount: tx.amount,
             isTransaction: true,
             _id: tx._id
        }));
        
        // Inyectar en extraExpenses (solo en memoria)
        if (!dailyCash.extraExpenses) dailyCash.extraExpenses = [];
        dailyCash.extraExpenses.push(...mappedSupplierPayments);

    } catch (txErr) {
        console.error("Error fetching transactions in getTodayCash:", txErr);
    }
    // ---------------------------------------------------

    // Convertir a objeto plano para inyectar transacciones
    let finalDailyCash = dailyCash;
    if (finalDailyCash.toObject) finalDailyCash = finalDailyCash.toObject();

    // Inyectar en la respuesta
    return res.status(200).json({ 
        ...finalDailyCash, 
        transactions // Array extra con los pagos de clientes
    });

  } catch (error) {
    console.error("❌ Error al obtener caja del día:", error);
    res.status(500).json({
      message: "Error al obtener la caja del día",
      error: error.message,
    });
  }
};


/* ==========================================================
   🔴 CERRAR LA CAJA DEL DÍA
========================================================== */
export const closeDailyCash = async (req, res) => {
  try {
    const { extraExpenses = [], supplierPayments = [], finalReal = null } = req.body;
    
    const ownerId = req.user.createdBy || req.user._id;

    // 📅 Rango del día local (UTC)
    const { start, end } = getLocalDayRangeUTC(new Date());

    // ✅ Buscar la caja abierta del día
    const dailyCash = await DailyCash.findOne({
      user: ownerId,
      date: { $gte: start, $lte: end },
    });

    if (!dailyCash) {
      return res
        .status(404)
        .json({ message: "No existe una caja abierta para hoy." });
    }

    if (dailyCash.status === "cerrada") {
      return res
        .status(400)
        .json({ message: "⚠️ La caja del día ya fue cerrada." });
    }

    // 🧮 Calcular totales (usando la lista combinada)
    if (extraExpenses.length > 0) {
      dailyCash.extraExpenses.push(...extraExpenses);
    }
    if (supplierPayments.length > 0) {
      dailyCash.supplierPayments.push(...supplierPayments);
    }


    const totalExpenses = dailyCash.extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPayments = dailyCash.supplierPayments.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalOut = totalExpenses + totalPayments;
    const finalExpected = dailyCash.totalSalesAmount - totalOut;
    const real = finalReal ?? finalExpected;
    const difference = real - finalExpected;

    // 🧾 Actualizar registro
    dailyCash.totalOut = totalOut;
    dailyCash.finalExpected = finalExpected;
    dailyCash.finalReal = real;
    dailyCash.difference = difference;
    dailyCash.status = "cerrada";
    dailyCash.closedAt = new Date();

    await dailyCash.save();

    res.status(200).json({
      message: "✅ Caja cerrada correctamente.",
      data: dailyCash,
    });
  } catch (error) {
    console.error("❌ Error al cerrar caja:", error);
    res.status(500).json({
      message: "Error al cerrar la caja.",
      error: error.message,
    });
  }
};

/* ==========================================================
   📆 LISTAR TODAS LAS CAJAS (ABIERTAS Y CERRADAS) 
========================================================== */

export const getClosedCashDays = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
       return res.status(400).json({ message: "Se requiere un ID de usuario." });
    }

    // Buscamos el usuario objetivo (el que viene en la URL)
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // 🔍 Determinar el ownerId según el rol del usuario OBJETIVO
    let ownerId;
    if (targetUser.role === "admin") {
      ownerId = targetUser._id;
    } else if (targetUser.role === "empleado") {
      // Si es empleado, verificamos su creador (dueño)
      ownerId = targetUser.createdBy;
    } else {
      // Fallback
      ownerId = targetUser.createdBy || targetUser._id;
    }
    // Siempre devolver ventas populadas
    const days = await DailyCash.find({ user: ownerId })
      .sort({ date: -1 })
      .populate({
        path: "sales",
        populate: { path: "products.product", select: "name price cost" },
      });



    return res.status(200).json(days);
  } catch (error) {
    console.error("❌ Error en getClosedCashDays:", error);
    res.status(500).json({
      message: "Error al obtener días de caja",
      error: error.message,
    });
  }
};


/* ==========================================================
   📅 OBTENER CAJA POR FECHA (YYYY-MM-DD) 
========================================================== */
export const getDailyCashByDate = async (req, res) => {

  // console.log()
  try {
    const { date } = req.params;
    if (!date || date === "undefined") return res.status(400).json({ message: "Fecha requerida" });
    
    const ownerId = req.user.createdBy || req.user._id;

    // 👉 Convertir string "YYYY-MM-DD" a objeto Date sin compensar manualmente
    const localDate = new Date(`${date}T00:00:00-03:00`);
    if (isNaN(localDate.getTime())) {
      return res.status(400).json({ message: "Formato de fecha inválido." });
    }
    const { start, end } = getLocalDayRangeUTC(localDate); // esta función ya hace el ajuste UTC-3

    // console.log("🕓 Buscando caja entre:", start.toISOString(), "→", end.toISOString());

    const dailyCash = await DailyCash.findOne({
      user: ownerId,
      date: { $gte: start, $lte: end },
    }).populate({
      path: "sales",
      populate: { path: "products.product", select: "name price cost" },
    }).lean();

    if (!dailyCash) {
       // Si no existe, buscamos si hay transacciones huérfanas antes de dar 404? 
       // No, si no hay caja, no hay dashboard main.
      return res.status(404).json({ message: "No se encontró caja para esa fecha." });
    }

    // ---------------------------------------------------
    // 🧠 AGREGAR TRANSACCIONES "CLIENT_PAYMENT" DE LA FECHA
    // ---------------------------------------------------
    let transactions = [];
    try {
        const Transaction = (await import("../models/Transaction.js")).default;
        // Reutilizamos start/end calculados arriba
        transactions = await Transaction.find({
            user: ownerId,
            type: "CLIENT_PAYMENT",
            date: { $gte: start, $lte: end }
        }).populate('client', 'name').sort({ date: -1 });

    } catch (txErr) {
        console.error("Error fetching transactions in getDailyCashByDate:", txErr);
    }
    
    // Al usar lean(), dailyCash ya es un objeto plano.
    let finalDailyCash = dailyCash;

    // ---------------------------------------------------
    // 🧠 AGREGAR PAGOS A PROVEEDORES COMO GASTOS (SUPPLIER_PAYMENT)
    // ---------------------------------------------------
    try {
        const Transaction = (await import("../models/Transaction.js")).default;
        
        const supplierPayments = await Transaction.find({
            user: ownerId,
            type: "SUPPLIER_PAYMENT",
            date: { $gte: start, $lte: end }
        }).populate('supplier', 'name').sort({ date: -1 });

        // Mapear a formato de gasto para el frontend
        const mappedSupplierPayments = supplierPayments.map(tx => ({
             description: `Pago a Proveedor: ${tx.supplier?.name || "Desconocido"} - ${tx.description || ""}`,
             amount: tx.amount,
             isTransaction: true,
             _id: tx._id
        }));

        if (!finalDailyCash.extraExpenses) finalDailyCash.extraExpenses = [];
        finalDailyCash.extraExpenses.push(...mappedSupplierPayments);
        
        console.log(`[DEBUG] Supplier Payments merged: ${mappedSupplierPayments.length} items`);

    } catch (err) {
        console.error("Error fetching supplier payments in getDailyCashByDate:", err);
    }




    res.status(200).json({
        ...finalDailyCash,
        transactions
    });
  } catch (error) {
    console.error("❌ Error al obtener caja por fecha:", error);
    res.status(500).json({
      message: "Error al obtener caja por fecha",
      error: error.message,
    });
  }
};

/* ==========================================================
        CERRAR CAJA POR ID
========================================================== */


export const closeDailyCashById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.createdBy || req.user._id;

    const dailyCash = await DailyCash.findOne({ 
      _id: id,
      user: ownerId
    });

    if (!dailyCash) {
      return res.status(404).json({ message: "Caja no encontrada." });
    }

    if (dailyCash.status === "cerrada") {
      return res.status(400).json({ message: "La caja ya está cerrada." });
    }

    const { extraExpenses = [], supplierPayments = [], finalReal = null } = req.body;

    // 🔄 CORRECCIÓN: Fusionar gastos en lugar de reemplazar
    if (extraExpenses.length > 0) {
      dailyCash.extraExpenses.push(...extraExpenses);
    }
    
    if (supplierPayments.length > 0) {
      dailyCash.supplierPayments.push(...supplierPayments);
    }

    // 🧮 CORRECCIÓN: Calcular totales usando dailyCash.extraExpenses (la lista final completa)
    const totalExpenses = dailyCash.extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPayments = dailyCash.supplierPayments.reduce((sum, p) => sum + (p.total || 0), 0);

    const totalOut = totalExpenses + totalPayments;
    const finalExpected = dailyCash.totalSalesAmount - totalOut;
    const real = finalReal ?? finalExpected;
    const difference = real - finalExpected;

    dailyCash.totalOut = totalOut;
    dailyCash.finalExpected = finalExpected;
    dailyCash.finalReal = real;
    dailyCash.difference = difference;
    dailyCash.status = "cerrada";
    dailyCash.closedAt = new Date();

    await dailyCash.save();

    return res.status(200).json({
      message: "Caja cerrada correctamente.",
      dailyCash
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al cerrar caja." });
  }
};


/* ==========================================================
   ✏️ ACTUALIZAR DAILY CASH POR FECHA
========================================================== */
export const updateDailyCashByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { status, description, extraExpenses, supplierPayments, overwrite } = req.body;
    
    const ownerId = req.user.createdBy || req.user._id;

    if (!date) {
      return res.status(400).json({ message: "Fecha o ID requerida." });
    }

    // 1. Construir query de actualización (usar $push para arrays, $set para campos planos)
    const updateQuery = {};

    // Campos a setear
    const setFields = {
      ...(status && { status }),
      ...(description && { description }),
      ...(status === "cerrada" && { closedAt: new Date() }),
    };

    // Arrays a pushear (para no pisar los anteriores)
    const pushFields = {};

    // LOGIC: Si overwrite es true, usamos $set para los arrays. Si no, usamos $push.
    if (overwrite) {
        if (extraExpenses) setFields.extraExpenses = extraExpenses;
        if (supplierPayments) setFields.supplierPayments = supplierPayments;
    } else {
        if (extraExpenses && extraExpenses.length > 0) {
          pushFields.extraExpenses = {
            $each: Array.isArray(extraExpenses) ? extraExpenses : [extraExpenses],
          };
        }
        if (supplierPayments && supplierPayments.length > 0) {
          pushFields.supplierPayments = {
            $each: Array.isArray(supplierPayments) ? supplierPayments : [supplierPayments],
          };
        }
    }

    if (Object.keys(setFields).length > 0) {
      updateQuery.$set = setFields;
    }

    if (Object.keys(pushFields).length > 0) {
      updateQuery.$push = pushFields;
    }

    let updated;

    // 2. Si 'date' es un ID de MongoDB válido, buscar por ID
    if (mongoose.Types.ObjectId.isValid(date)) {
      updated = await DailyCash.findOneAndUpdate(
        { _id: date, user: ownerId },
        updateQuery,
        { new: true }
      );
    } else {
      // 3. Si no es un ID, asumir que es una fecha (YYYY-MM-DD)
      if (date === "undefined" || date === "null") {
        return res.status(400).json({ message: "Fecha inválida." });
      }

      const localDate = new Date(`${date}T00:00:00-03:00`);
      if (isNaN(localDate.getTime())) {
        return res.status(400).json({ message: "Formato de fecha inválido." });
      }

      const { start, end } = getLocalDayRangeUTC(localDate);

      updated = await DailyCash.findOneAndUpdate(
        {
          user: ownerId,
          date: { $gte: start, $lte: end },
        },
        updateQuery,
        { new: true }
      );
    }

    if (!updated) {
      return res.status(404).json({ message: "No se encontró caja para esa fecha." });
    }

    res.status(200).json({
      success: true,
      message: "✅ Caja actualizada correctamente.",
      dailyCash: updated,
    });
  } catch (error) {
    console.error("❌ Error al actualizar daily cash:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar daily cash.",
      error: error.message,
    });
  }
};
