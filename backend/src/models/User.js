import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "empleado"],
      default: "empleado",
    },
    active: { 
      type: Boolean, 
      default: false
    },
    // 🎯 SaaS Membership System
    membershipTier: {
      type: String,
      enum: ["basic", "medium", "pro"],
      default: "basic",
    },
    membershipStartDate: {
      type: Date,
      default: Date.now,
    },
    membershipEndDate: {
      type: Date,
      default: null,
    },
    // ✉️ Email Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
  
);

// 📊 Índices para mejorar performance
userSchema.index({ email: 1 }); // Búsqueda por email (login, registro)
userSchema.index({ verificationCode: 1 }); // Verificación de códigos
userSchema.index({ membershipTier: 1 }); // Filtrado por tipo de membresía
userSchema.index({ isEmailVerified: 1 }); // Filtrado por verificación

// 🔐 Encriptar contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🕒 Helper para calcular días restantes de prueba
userSchema.methods.calculateTrialDaysRemaining = function () {
  if (!this.membershipStartDate) return "0";

  const trialDurationDays = 90;
  // Fecha de inicio + 90 días
  const trialEndDate = new Date(this.membershipStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);

  const now = new Date();
  
  // Diferencia en milisegundos
  const diffTime = trialEndDate - now;
  
  // Convertir a días (redondeando hacia arriba para no mostrar 0 si quedan horas)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Si ya pasó (negativo), devolver 0
  return diffDays > 0 ? diffDays.toString() : "0";
};

const User = mongoose.model("User", userSchema);
export default User;
