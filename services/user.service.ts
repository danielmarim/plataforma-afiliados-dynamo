import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Serviço de acesso a dados de usuários.
 * Regras de negócio serão adicionadas em etapas futuras.
 */
export const userService = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { affiliate: true },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { affiliate: true },
    });
  },
};
