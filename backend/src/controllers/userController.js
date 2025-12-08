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

    // 🔐 Generar código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false,
    });

    // 📧 Enviar email de verificación
    try {
      const { sendVerificationEmail } = await import("../utils/emailService.js");
      await sendVerificationEmail(email, verificationCode, name);
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError);
      // Eliminar usuario si no se pudo enviar el email
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        message: "Error al enviar el email de verificación. Por favor, intenta nuevamente." 
      });
    }

    res.status(201).json({
      message: "Usuario registrado. Por favor, verifica tu email con el código enviado.",
      email: user.email,
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
      // ✉️ Verificar si el email está verificado
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          message: "Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
          emailNotVerified: true,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        createdAt: user.createdAt,
        membershipStartDate: user.membershipStartDate,
        trialDaysRemaining: user.calculateTrialDaysRemaining(),
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
    const user = await User.findById(req.user._id);
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
      membershipTier: user.membershipTier,
      createdAt: user.createdAt,
      membershipStartDate: user.membershipStartDate,
      trialDaysRemaining: user.calculateTrialDaysRemaining(),
      isEmailVerified: user.isEmailVerified,
      logoUrl: customization?.logoUrl || null,
    });

  } catch (error) {
    console.log(res.status(500).json({ message: error.message }));
    res.status(500).json({ message: error.message });
  }
};

// 📌 Verificar email con código
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si ya está verificado
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "El email ya está verificado" });
    }

    // Verificar código
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Código de verificación inválido" });
    }

    // Verificar expiración
    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ 
        message: "El código ha expirado. Solicita uno nuevo.",
        codeExpired: true,
      });
    }

    // ✅ Activar cuenta
    user.isEmailVerified = true;
    user.active = true;  // Activar usuario después de verificar email
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Retornar token para auto-login
    res.json({
      message: "Email verificado correctamente",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      createdAt: user.createdAt,
      membershipStartDate: user.membershipStartDate,
      trialDaysRemaining: user.calculateTrialDaysRemaining(),
      token: generateToken(user._id),
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Reenviar código de verificación
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si ya está verificado
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "El email ya está verificado" });
    }

    // 🔐 Generar nuevo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // 📧 Reenviar email
    try {
      const { sendVerificationEmail } = await import("../utils/emailService.js");
      await sendVerificationEmail(email, verificationCode, user.name);
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError);
      return res.status(500).json({ 
        message: "Error al enviar el email. Por favor, intenta nuevamente." 
      });
    }

    res.json({
      message: "Código de verificación reenviado. Revisa tu email.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

