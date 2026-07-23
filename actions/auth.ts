"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";
import type { ActionResponse } from "@/types";
import { DEFAULT_LOGIN_REDIRECT } from "@/utils/constants";

/**
 * Autentica o usuário com e-mail e senha.
 */
export async function loginAction(
  values: LoginInput
): Promise<ActionResponse> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "E-mail ou senha incorretos." };
      }
      return { success: false, error: "Erro ao autenticar. Tente novamente." };
    }
    // Redirecionamentos do Next.js são lançados como erro e devem ser propagados
    throw error;
  }
}

/**
 * Registra um novo usuário (afiliado) com credenciais.
 */
export async function registerAction(
  values: RegisterInput
): Promise<ActionResponse> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: "Este e-mail já está cadastrado." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      affiliate: {
        create: {},
      },
    },
  });

  return {
    success: true,
    message: "Conta criada com sucesso! Faça login para continuar.",
  };
}

/**
 * Inicia o fluxo de recuperação de senha.
 * O envio do e-mail (Resend) será conectado na etapa de regras de negócio.
 */
export async function forgotPasswordAction(
  values: ForgotPasswordInput
): Promise<ActionResponse> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Resposta genérica por segurança (não revela se o e-mail existe)
  return {
    success: true,
    message:
      "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação.",
  };
}

/**
 * Encerra a sessão do usuário.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
