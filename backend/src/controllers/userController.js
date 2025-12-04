import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import Customization from "../models/Customization.js";

// 📌 Actualizar perfil
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const { name, email, password } = req.body;

    // ==========================
    // 🟧 EMPLEADO: solo puede modificar su nombre
    // ==========================
    if (user.role === "empleado") {
      user.name = name || user.name;
      await user.save();
      return res.json({
        message: "Perfil actualizado",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // ==========================
    // 🟦 ADMIN: puede modificar TODO
    // ==========================
    if (name) user.name = name;
    if (email) user.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      message: "Perfil actualizado",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Actualizar contraseña

export const changeMyPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { oldPassword, newPassword } = req.body;

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Verificar contraseña actual
    const match = await user.matchPassword(oldPassword);
    if (!match) return res.status(400).json({ message: "Contraseña incorrecta" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Registrar usuario
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Usuario ya existe" });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Login usuario
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Credenciales inválidas" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Obtener perfil
export const getUserProfile = async (req, res) => {
  try {
    // 👉 Obtener datos del usuario
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 👉 Obtener personalización (logo)
    const customization = await Customization.findOne(
      { user: req.user._id },
      { logoUrl: 1, _id: 0 }
    ).lean();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // IMAGEN POR DEFECTO SI NO HAY LOGO
      logoUrl: customization?.logoUrl || "El usuario no cargo imagen",
    });

  } catch (error) {
    console.log(res.status(500).json({ message: error.message }));
    res.status(500).json({ message: error.message });
  }
};
