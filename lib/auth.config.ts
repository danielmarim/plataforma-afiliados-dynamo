import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/lib/validations/auth";

/**
 * Configuração base do NextAuth (Auth.js v5).
 * Este arquivo é "edge-safe": não importa o Prisma diretamente,
 * permitindo seu uso no middleware.
 * O provider Credentials tem o `authorize` completo definido em lib/auth.ts.
 */
export default {
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        // A verificação real (com Prisma + bcrypt) é feita em lib/auth.ts.
        // Este stub existe apenas para tipagem no contexto edge.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
