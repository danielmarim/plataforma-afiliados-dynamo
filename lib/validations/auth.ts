import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail.")
    .email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "O nome deve ter pelo menos 3 caracteres.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
    email: z
      .string()
      .min(1, "Informe o e-mail.")
      .email("E-mail inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail.")
    .email("E-mail inválido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
