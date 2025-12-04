import User from "../models/User.js";

// 🟢 Crear empleado
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "El email ya está registrado." });

    const employee = await User.create({
      name,
      email,
      password,
      role: "empleado",
    });

    res.status(201).json({
      message: "Empleado creado correctamente.",
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear empleado", error: error.message });
  }
};

// 🟡 Listar empleados
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "empleado" })
      .select("-password");

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener empleados", error: error.message });
  }
};

// 🔵 Editar empleado (nombre, email)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    }).select("-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar empleado", error: error.message });
  }
};

// 🔴 Desactivar empleado (soft delete)
export const disableEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { active: false });

    res.json({ message: "Empleado desactivado correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar empleado", error: error.message });
  }
};

// 🟢 Activar empleado (soft-restore)
export const enableEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { active: true });

    res.json({ message: "Empleado activado correctamente." });
  } catch (error) {
    res.status(500).json({
      message: "Error al activar empleado",
      error: error.message,
    });
  }
};


// 🔐 Cambiar contraseña de empleado
export const changeEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(id);
    user.password = newPassword; 
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar contraseña", error: error.message });
  }
};

// 🗑️ Eliminar empleado definitivamente
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Empleado no encontrado" });

    await user.deleteOne();

    return res.json({ message: "Empleado eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar empleado",
      error: error.message,
    });
  }
};

