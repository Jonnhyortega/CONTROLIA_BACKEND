
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
    if (!type || !["CLIENT_PAYMENT", "SUPPLIER_PAYMENT"].includes(type)) {
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
      // Asumiendo balance positivo = deuda del cliente
      await Client.findByIdAndUpdate(clientId, { $inc: { balance: -amount } });
    } else if (type === "SUPPLIER_PAYMENT") {
      // Si pagamos al proveedor, nuestra deuda disminuye
      // Asumiendo debt positivo = deuda nuestra
      await Supplier.findByIdAndUpdate(supplierId, { $inc: { debt: -amount } });
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
        // Si el pago aumentó (diff > 0), el balance baja más (-diff).
        // Si el pago disminuyó (diff < 0), el balance sube (-diff se vuelve positivo).
        await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: -diff } });
      } else if (transaction.type === "SUPPLIER_PAYMENT" && transaction.supplier) {
        await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: -diff } });
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
      // Si borramos un pago, el balance (deuda) vuelve a subir
      await Client.findByIdAndUpdate(transaction.client, { $inc: { balance: transaction.amount } });
    } else if (transaction.type === "SUPPLIER_PAYMENT" && transaction.supplier) {
      // Si borramos un pago a proveedor, la deuda vuelve a subir
      await Supplier.findByIdAndUpdate(transaction.supplier, { $inc: { debt: transaction.amount } });
    }

    await transaction.deleteOne();

    res.json({ message: "Transacción eliminada y saldo revertido." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar transacción.", error: error.message });
  }
};
