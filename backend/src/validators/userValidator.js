import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6).optional(),
  role: z.string().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export const googleSchema = z.object({
  id_token: z.string().min(10, "id_token inválido"),
});

export default {
  registerSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
};
