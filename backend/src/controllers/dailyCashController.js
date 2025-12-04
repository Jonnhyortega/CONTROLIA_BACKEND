import DailyCash from "../models/DailyCash.js";
import Sale from "../models/Sale.js";
import { getLocalDayRangeUTC } from "../utils/dateHelpers.js";

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
    // 📆 Obtener rango del día local en UTC
    const { start, end } = getLocalDayRangeUTC(new Date());

    // 🧾 Buscar caja existente del día
    let dailyCash = await DailyCash.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .populate({
        path: "sales",
        populate: { path: "products.product", select: "name price" },
      })
      .lean();

    // 🚫 Si no existe, crearla con las ventas del día
    if (!dailyCash) {
      const sales = await Sale.find({
        user: req.user._id,
        date: { $gte: start, $lte: end },
      }).populate("products.product", "name price");

      const totalSalesAmount = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalOperations = sales.length;

      dailyCash = await DailyCash.create({
        user: req.user._id,
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
          populate: { path: "products.product", select: "name price" },
        })
        .lean();
    }

    return res.status(200).json(dailyCash);
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
    
    db.dailycashes.deleteMany({
      totalSalesAmount: 0,
      totalOperations: 0,
      totalOut: 0,
      finalExpected: 0,
      finalReal: 0,
      difference: 0
    });
    
    // 📅 Rango del día local (UTC)
    const { start, end } = getLocalDayRangeUTC(new Date());

    // ✅ Buscar la caja abierta del día
    const dailyCash = await DailyCash.findOne({
      user: req.user._id,
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

    // 🧮 Calcular totales
    const totalExpenses = extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPayments = supplierPayments.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalOut = totalExpenses + totalPayments;
    const finalExpected = dailyCash.totalSalesAmount - totalOut;
    const real = finalReal ?? finalExpected;
    const difference = real - finalExpected;

    // 🧾 Actualizar registro
    dailyCash.extraExpenses = extraExpenses;
    dailyCash.supplierPayments = supplierPayments;
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
   📆 LISTAR TODAS LAS CAJAS (ABIERTAS Y CERRADAS) - DEBUG
========================================================== */
export const getClosedCashDays = async (req, res) => {
  try {
    const days = await DailyCash.find({ user: req.user._id })
      .select("date status totalSalesAmount totalOut finalExpected difference")
      .sort({ date: -1 });

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
    if (!date) return res.status(400).json({ message: "Fecha requerida" });

    // 👉 Convertir string "YYYY-MM-DD" a objeto Date sin compensar manualmente
    const localDate = new Date(`${date}T00:00:00-03:00`);
    const { start, end } = getLocalDayRangeUTC(localDate); // esta función ya hace el ajuste UTC-3

    // console.log("🕓 Buscando caja entre:", start.toISOString(), "→", end.toISOString());

    const dailyCash = await DailyCash.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    }).populate({
      path: "sales",
      populate: { path: "products.product", select: "name price" },
    });

    if (!dailyCash) {
      return res.status(404).json({ message: "No se encontró caja para esa fecha." });
    }

    res.status(200).json(dailyCash);
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

    const dailyCash = await DailyCash.findOne({ 
      _id: id,
      user: req.user._id
    });

    if (!dailyCash) {
      return res.status(404).json({ message: "Caja no encontrada." });
    }

    if (dailyCash.status === "cerrada") {
      return res.status(400).json({ message: "La caja ya está cerrada." });
    }

    const { extraExpenses = [], supplierPayments = [], finalReal = null } = req.body;

    const totalExpenses = extraExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = supplierPayments.reduce((sum, p) => sum + p.total, 0);

    const totalOut = totalExpenses + totalPayments;
    const finalExpected = dailyCash.totalSalesAmount - totalOut;
    const real = finalReal ?? finalExpected;
    const difference = real - finalExpected;

    dailyCash.extraExpenses = extraExpenses;
    dailyCash.supplierPayments = supplierPayments;
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
    const { status, description } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Fecha requerida." });
    }

    // Rango UTC correcto para ese día local
    const localDate = new Date(`${date}T00:00:00-03:00`);
    const { start, end } = getLocalDayRangeUTC_(localDate);

    const updated = await DailyCash.findOneAndUpdate(
      {
        user: req.user._id,
        date: { $gte: start, $lte: end },
      },
      {
        ...(status && { status }),
        ...(description && { description }),
        ...(status === "cerrada" && { closedAt: new Date() }),
      },
      { new: true }
    );

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
