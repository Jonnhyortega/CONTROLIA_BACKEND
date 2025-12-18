
import Transaction from "../models/Transaction.js";
import Client from "../models/Client.js";
import Supplier from "../models/Supplier.js";

/* ==========================================================
   AGREGAR TRANSACCIÓN (PAGO)
   - Empleados y Admin
   - Sube imagen de comprobante (si existe)
   - Descuenta deuda/balance
========================================================== */
export const createTransaction = async (req, res) => {
  try {
    const { type, amount, clientId, supplierId, description, date } = req.body;
    
    // Validaciones básicas
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor a 0." });
    }
    if (!type || !["CLIENT_PAYMENT", "SUPPLIER_PAYMENT", "CLIENT_DEBT", "SUPPLIER_DEBT"].includes(type)) {
      return res.status(400).json({ message: "Tipo de transacción inválido." });
    }
    if (type === "CLIENT_PAYMENT" && !clientId) {
      return res.status(400).json({ message: "Se requiere un Cliente para este pago." });
    }
    if (type === "SUPPLIER_PAYMENT" && !supplierId) {
      return res.status(400).json({ message: "Se requiere un Proveedor para este pago." });
    }

    // Manejo de imagen (Cloudinary)
    const imageUrl = req.file ? req.file.path : null;

    // Multi-tenancy
    const ownerId = req.user.createdBy || req.user._id;

    // Crear objeto Transacción
    const newTransaction = new Transaction({
      type,
      amount,
      client: clientId || null,
      supplier: supplierId || null,
      description,
      imageUrl,
      date: date || Date.now(),
      createdBy: req.user._id, // Quien ejecutó la acción
      user: ownerId, // Dueño de los datos
    });

    // Guardar transacción
    await newTransaction.save();

    // Actualizar Saldo/Deuda
    if (type === "CLIENT_PAYMENT") {
      // Si el cliente paga, su deuda (balance) disminuye
      await Client.findByIdAndUpdate(clientId, { $inc: { balance: -amount } });

      // -------------------------------------------------------------
      // 💰 IMPACTAR CAJA (Solo si es un pago real de cliente)
      // -------------------------------------------------------------
      // Importar dependencias necesarias o helpers
      // Nota: Si este archivo no importa DailyCash ni getLocalDayRangeUTC, necesitamos hacerlo.
      // Como no puedo agregar imports arriba fácilmente con este replace, asumiremos que están o los agregaremos luego.
      // Asumimos que DailyCash y helper están disponibles o copiamos la lógica simple.
      
      try {
          // Import dinámico si no están arriba (para asegurar que funcione sin romper imports existentes)
          const DailyCashModel = (await import("../models/DailyCash.js")).default;
          // Replicar lógica de fecha UTC
          const now = new Date();
          // Ajuste simple UTC-3 Argentina
          const offsetHours = 3;
          const localTime = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);
          localTime.setUTCHours(0, 0, 0, 0);
          const start = new Date(localTime.getTime() + offsetHours * 60 * 60 * 1000);
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

          await DailyCashModel.findOneAndUpdate(
            { user: ownerId, date: { $gte: start, $lte: end } },
            { 
               $inc: { totalSalesAmount: amount },
               $setOnInsert: { user: ownerId, date: start, status: "abierta" }
            },
            { upsert: true }
          );
      } catch (err) {
          console.error("Error actualizando caja con el pago:", err);
      }

    } else if (type === "SUPPLIER_PAYMENT") {
      // Si pagamos al proveedor, nuestra deuda disminuye
      await Supplier.findByIdAndUpdate(supplierId, { $inc: { debt: -amount } });
 
      // Opcional: Esto es dinero que SALIE, deberíamos registrarlo como gasto en caja?
      // Por consistencia, si pagamos desde caja, debería ser un 'extraExpense' o 'supplierPayment' en DailyCash.
      // Pero el usuario preguntó específicamente por cobros a clientes.

    } else if (type === "CLIENT_DEBT") {
      // Venta fiada / Cuenta corriente -> Aumenta la deuda del cliente
      await Client.findByIdAndUpdate(clientId, { $inc: { balance: amount } });

    } else if (type === "SUPPLIER_DEBT") {
      // Compra a proveedor / Pedido recibido -> Aumenta nuestra deuda con proveedor
      await Supplier.findByIdAndUpdate(supplierId, { $inc: { debt: amount } });
    }

    res.status(201).json({
      success: true,
      message: "Transacción registrada correctamente.",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Error al registrar la transacción.", error: error.message });
  }
};

/* ==========================================================
   OBTENER TRANSACCIONES
   - Filtros por cliente o proveedor
========================================================== */
export const getTransactions = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const { clientId, supplierId } = req.query;

    const query = { user: ownerId };
    
    if (clientId) query.client = clientId;
    if (supplierId) query.supplier = supplierId;

    // Podríamos agregar paginación si se espera mucho historial
    const transactions = await Transaction.find(query)
      .populate("createdBy", "name email") // Ver quién cargó el pago
      .sort({ date: -1, createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener transacciones.", error: error.message });
  }
};

/* ==========================================================
   MODIFICAR TRANSACCIÓN (SOLO ADMIN)
   - Recalcula balance/deuda si cambia el monto
========================================================== */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, description } = req.body;
    // Nota: No permitimos cambiar Client/Supplier o Type fácilmente porque complica la lógica de saldo.
    // Si necesitan eso, mejor borrar y crear de nuevo. Aquí solo permitimos editar monto, fecha, desc, imagen.

    const ownerId = req.user.createdBy || req.user._id; // Debería ser req.user._id porque es adminOnly, pero mantenemos consistencia

    const transaction = await Transaction.findOne({ _id: id, user: ownerId });
    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada." });
    }

    // Si hay nueva imagen
    if (req.file) {
      transaction.imageUrl = req.file.path;
    }

    // Si cambia el monto, ajustar saldos
    if (amount !== undefined && Number(amount) !== transaction.amount) {
      const oldAmount = transaction.amount;
      const newAmount = Number(amount);
      const diff = newAmount - oldAmount; // Lo que aumentó el pago

      if (transaction.type === "CLIENT_PAYMENT" && transaction.client) {
        // PAGO: Si sube el monto, baja la deuda: -diff
        await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: -diff } });
      } else if (transaction.type === "SUPPLIER_PAYMENT" && transaction.supplier) {
        // PAGO: Si sube el monto, baja la deuda: -diff
        await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: -diff } });

      } else if (transaction.type === "CLIENT_DEBT" && transaction.client) {
        // DEUDA: Si sube el monto, sube la deuda: +diff
        await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: diff } });

      } else if (transaction.type === "SUPPLIER_DEBT" && transaction.supplier) {
        // DEUDA: Si sube el monto, sube la deuda: +diff
        await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: diff } });
      }

      transaction.amount = newAmount;
    }

    if (date) transaction.date = date;
    if (description) transaction.description = description;

    await transaction.save();

    res.json({
      success: true,
      message: "Transacción actualizada.",
      transaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Error al actualizar transacción.", error: error.message });
  }
};

/* ==========================================================
   ELIMINAR TRANSACCIÓN (SOLO ADMIN)
   - Revertir saldo
========================================================== */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.createdBy || req.user._id;

    const transaction = await Transaction.findOne({ _id: id, user: ownerId });
    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada." });
    }

    // Revertir efecto en saldo
    if (transaction.type === "CLIENT_PAYMENT" && transaction.client) {
      // Borrar PAGO -> SUBE la deuda (volvemos a deber)
      await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: transaction.amount } });

      // -------------------------------------------------------------
      // 💰 REVERTIR IMPACTO EN CAJA
      // -------------------------------------------------------------
      try {
          const DailyCashModel = (await import("../models/DailyCash.js")).default;
          // Reconstruir rango de fecha del pago original
          const txDate = new Date(transaction.date); 
          // Ajuste UTC-3 (Argentina) manual para obtener start/end del día de esa transacción
          const offsetHours = 3;
          const localTime = new Date(txDate.getTime() - offsetHours * 60 * 60 * 1000);
          localTime.setUTCHours(0, 0, 0, 0);
          const start = new Date(localTime.getTime() + offsetHours * 60 * 60 * 1000);
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

          await DailyCashModel.findOneAndUpdate(
            { user: ownerId, date: { $gte: start, $lte: end } },
            { $inc: { totalSalesAmount: -transaction.amount } }
          );
      } catch (err) {
          console.error("Error revirtiendo caja al eliminar pago:", err);
      }

    } else if (transaction.type === "SUPPLIER_PAYMENT" && transaction.supplier) {
      await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: transaction.amount } });

    } else if (transaction.type === "CLIENT_DEBT" && transaction.client) {
      // Borrar DEUDA -> BAJA la deuda (anulamos el fiado)
      await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: -transaction.amount } });

    } else if (transaction.type === "SUPPLIER_DEBT" && transaction.supplier) {
      // Borrar DEUDA -> BAJA la deuda (anulamos el pedido)
      await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: -transaction.amount } });
    }

    await transaction.deleteOne();

    res.json({ message: "Transacción eliminada y saldo revertido." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar transacción.", error: error.message });
  }
};
