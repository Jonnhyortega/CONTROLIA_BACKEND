import User from "../models/User.js";

export const checkSubscription = async (req, res, next) => {
  try {
    // req.user viene del middleware protect previo
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    let userToCheck = req.user;

    // Si es empleado, debemos verificar el estatus del dueño (quien paga)
    if (req.user.role === "empleado" && req.user.createdBy) {
      const owner = await User.findById(req.user.createdBy);
      if (owner) {
        userToCheck = owner;
      }
      // Si no encuentra al dueño, usamos al empleado (fallback), aunque esto sería un error de integridad
    }

    // 1. Chequear si tiene suscripción activa (Pagada)
    if (userToCheck.subscriptionStatus === "authorized") {
      return next();
    }

    // 2. Chequear si tiene "Acceso de Emergencia" activo
    if (userToCheck.emergencyAccessExpires && new Date() < new Date(userToCheck.emergencyAccessExpires)) {
      return next();
    }

    // 3. Chequear si está en periodo de prueba
    const daysRemaining = userToCheck.calculateTrialDaysRemaining();
    if (daysRemaining !== "0") {
      return next();
    }

    // 🚫 Si llega aquí, no tiene acceso
    return res.status(403).json({ 
      message: "Tu periodo de prueba ha finalizado y no tienes una suscripción activa.",
      subscriptionExpired: true 
    });

  } catch (error) {
    console.error("Error en checkSubscription:", error);
    res.status(500).json({ message: "Error al verificar suscripción" });
  }
};
