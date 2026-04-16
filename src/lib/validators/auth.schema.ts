import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  email: z.email({ message: 'El email no es válido.' }),
  password: z.string().min(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  }),
});

export const loginSchema = z.object({
  email: z.email({ message: 'El email no es válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
