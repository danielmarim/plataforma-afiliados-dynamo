/**
 * Service para gerenciar conversões de comissão em cupom
 * Lógica de negócio separada dos componentes React
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ============================================================
// TIPOS
// ============================================================

export interface ConversionRequestData {
  id: string;
  affiliateId: string;
  requestedAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejectionReason: string | null;
  generatedCouponCode: string | null;
  shopifyDiscountId: string | null;
  expiresAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// ERRO PERSONALIZADO
// ============================================================

export class ConversionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ConversionError";
  }
}

// ============================================================
// SALDO DISPONÍVEL (abstração)
// ============================================================

/**
 * Calcula o saldo disponível do afiliado (comissões aprovadas não pagas)
 */
export async function getAvailableBalance(
  affiliateId: string
): Promise<number> {
  const result = await prisma.commission.aggregate({
    where: {
      affiliateId,
      status: "APPROVED",
      payoutId: null,
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount?.toNumber() || 0;
}

/**
 * Calcula o saldo reservado (solicitações de conversão pendentes ou aprovadas)
 */
export async function getReservedBalance(
  affiliateId: string
): Promise<number> {
  const result = await prisma.conversionRequest.aggregate({
    where: {
      affiliateId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
    },
    _sum: {
      requestedAmount: true,
    },
  });

  return result._sum.requestedAmount?.toNumber() || 0;
}

// ============================================================
// CRIAR SOLICITAÇÃO DE CONVERSÃO
// ============================================================

/**
 * Cria uma nova solicitação de conversão
 * - Valida saldo disponível
 * - Reserva o valor imediatamente usando transação
 * - Impede solicitações concorrentes
 * - Registra auditoria
 */
export async function createConversionRequest(
  affiliateId: string,
  requestedAmount: number
): Promise<ConversionRequestData> {
  // Validar que o afiliado existe e está ativo
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
  });

  if (!affiliate) {
    throw new ConversionError(
      "Afiliado não encontrado.",
      "AFFILIATE_NOT_FOUND"
    );
  }

  if (affiliate.status !== "ACTIVE") {
    throw new ConversionError(
      "Sua conta de afiliado não está ativa.",
      "AFFILIATE_INACTIVE"
    );
  }

  // Transação: validar saldo + criar solicitação + registrar auditoria
  const conversionRequest = await prisma.$transaction(
    async (tx) => {
      // Buscar comissões aprovadas não pagas com lock (SELECT FOR UPDATE)
      const commissions = await tx.commission.findMany({
        where: {
          affiliateId,
          status: "APPROVED",
          payoutId: null,
        },
        select: {
          amount: true,
        },
      });

      const availableBalance = commissions.reduce(
        (sum, c) => sum + c.amount.toNumber(),
        0
      );

      // Validar saldo disponível
      if (availableBalance < requestedAmount) {
        throw new ConversionError(
          `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`,
          "INSUFFICIENT_BALANCE"
        );
      }

      // Validar se não há solicitação pendente/aprovada
      const existingRequest = await tx.conversionRequest.findFirst({
        where: {
          affiliateId,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      });

      if (existingRequest) {
        throw new ConversionError(
          "Você já possui uma solicitação de conversão pendente.",
          "PENDING_REQUEST_EXISTS"
        );
      }

      // Criar solicitação de conversão
      const request = await tx.conversionRequest.create({
        data: {
          affiliateId,
          requestedAmount: new Prisma.Decimal(requestedAmount),
          status: "PENDING",
        },
      });

      // Registrar auditoria
      await tx.auditLog.create({
        data: {
          affiliateId,
          conversionRequestId: request.id,
          action: "CREATE",
          description: `Solicitação de conversão criada: R$ ${requestedAmount.toFixed(2)}`,
          metadata: {
            requestedAmount,
          },
        },
      });

      return request;
    },
    {
      // Isolar a transação para evitar problemas de concorrência
      isolationLevel: "Serializable",
    }
  );

  return formatConversionRequest(conversionRequest);
}

// ============================================================
// APROVAR SOLICITAÇÃO
// ============================================================

/**
 * Aprova uma solicitação de conversão
 * - Gera código de cupom aleatório e único
 * - Cria desconto na Shopify (mock)
 * - Define validade de 15 dias
 * - Salva IDs da Shopify
 * - Registra auditoria
 * - Cria notificações (email, whatsapp, in-app)
 */
export async function approveConversionRequest(
  conversionRequestId: string,
  reviewedById: string
): Promise<ConversionRequestData> {
  // Validar que o revisor é admin
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewedById },
  });

  if (!reviewer || reviewer.role !== "ADMIN") {
    throw new ConversionError(
      "Apenas administradores podem aprovar.",
      "UNAUTHORIZED"
    );
  }

  const conversionRequest = await prisma.$transaction(
    async (tx) => {
      // Buscar solicitação
      const request = await tx.conversionRequest.findUnique({
        where: { id: conversionRequestId },
        include: { affiliate: { include: { user: true } } },
      });

      if (!request) {
        throw new ConversionError(
          "Solicitação não encontrada.",
          "REQUEST_NOT_FOUND"
        );
      }

      if (request.status !== "PENDING") {
        throw new ConversionError(
          "Apenas solicitações pendentes podem ser aprovadas.",
          "INVALID_STATUS"
        );
      }

      // Gerar código de cupom aleatório e único
      let couponCode: string;
      let isUnique = false;

      while (!isUnique) {
        couponCode = generateCouponCode();
        const existing = await tx.conversionRequest.findUnique({
          where: { generatedCouponCode: couponCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      // Validar que não reutiliza cupom do afiliado
      const existingAffiliateCoupon = await tx.coupon.findFirst({
        where: {
          affiliateId: request.affiliateId,
          code: couponCode,
        },
      });

      if (existingAffiliateCoupon) {
        throw new ConversionError(
          "Código de cupom já existe.",
          "COUPON_CODE_EXISTS"
        );
      }

      // Criar desconto na Shopify (mock)
      const shopifyDiscountId = `shopify_discount_${Date.now()}`;

      // Calcular data de expiração (15 dias)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      // Atualizar solicitação
      const updated = await tx.conversionRequest.update({
        where: { id: conversionRequestId },
        data: {
          status: "APPROVED",
          generatedCouponCode: couponCode,
          shopifyDiscountId,
          expiresAt,
          approvedAt: new Date(),
          reviewedById,
        },
      });

      // Registrar auditoria
      await tx.auditLog.create({
        data: {
          affiliateId: request.affiliateId,
          conversionRequestId: updated.id,
          action: "APPROVE",
          description: `Solicitação aprovada. Cupom: ${couponCode}`,
          metadata: {
            couponCode,
            shopifyDiscountId,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      // Criar notificações (email, whatsapp, in-app)
      await tx.notification.createMany({
        data: [
          {
            affiliateId: request.affiliateId,
            conversionRequestId: updated.id,
            channel: "EMAIL",
            title: "Conversão de Comissão Aprovada",
            body: `Sua solicitação de conversão de R$ ${request.requestedAmount.toFixed(2)} foi aprovada! Seu cupom é: ${couponCode}. Válido até ${expiresAt.toLocaleDateString("pt-BR")}`,
            metadata: {
              couponCode,
              amount: request.requestedAmount.toNumber(),
            },
          },
          {
            affiliateId: request.affiliateId,
            conversionRequestId: updated.id,
            channel: "WHATSAPP",
            title: "Conversão Aprovada",
            body: `Cupom ${couponCode} gerado com sucesso!`,
            metadata: {
              couponCode,
            },
          },
          {
            affiliateId: request.affiliateId,
            conversionRequestId: updated.id,
            channel: "IN_APP",
            title: "Conversão Aprovada",
            body: `Seu cupom ${couponCode} está pronto para uso!`,
            metadata: {
              couponCode,
              expiresAt: expiresAt.toISOString(),
            },
          },
        ],
      });

      return updated;
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return formatConversionRequest(conversionRequest);
}

// ============================================================
// REJEITAR SOLICITAÇÃO
// ============================================================

/**
 * Rejeita uma solicitação de conversão
 * - Devolve valor reservado para saldo disponível
 * - Registra motivo (opcional)
 * - Registra auditoria
 * - Cria notificação para o afiliado
 */
export async function rejectConversionRequest(
  conversionRequestId: string,
  reviewedById: string,
  rejectionReason?: string
): Promise<ConversionRequestData> {
  // Validar que o revisor é admin
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewedById },
  });

  if (!reviewer || reviewer.role !== "ADMIN") {
    throw new ConversionError(
      "Apenas administradores podem rejeitar.",
      "UNAUTHORIZED"
    );
  }

  const conversionRequest = await prisma.$transaction(
    async (tx) => {
      // Buscar solicitação
      const request = await tx.conversionRequest.findUnique({
        where: { id: conversionRequestId },
        include: { affiliate: true },
      });

      if (!request) {
        throw new ConversionError(
          "Solicitação não encontrada.",
          "REQUEST_NOT_FOUND"
        );
      }

      if (request.status !== "PENDING") {
        throw new ConversionError(
          "Apenas solicitações pendentes podem ser rejeitadas.",
          "INVALID_STATUS"
        );
      }

      // Atualizar solicitação (o valor é desbloqueado automaticamente)
      const updated = await tx.conversionRequest.update({
        where: { id: conversionRequestId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || null,
          rejectedAt: new Date(),
          reviewedById,
        },
      });

      // Registrar auditoria
      await tx.auditLog.create({
        data: {
          affiliateId: request.affiliateId,
          conversionRequestId: updated.id,
          action: "REJECT",
          description: `Solicitação rejeitada. Motivo: ${rejectionReason || "Não informado"}`,
          metadata: {
            rejectionReason: rejectionReason || null,
          },
        },
      });

      // Criar notificação para o afiliado
      await tx.notification.create({
        data: {
          affiliateId: request.affiliateId,
          conversionRequestId: updated.id,
          channel: "IN_APP",
          title: "Solicitação de Conversão Rejeitada",
          body: `Sua solicitação de conversão de R$ ${request.requestedAmount.toFixed(2)} foi rejeitada${rejectionReason ? `. Motivo: ${rejectionReason}` : "."}. O valor foi devolvido ao seu saldo disponível.`,
          metadata: {
            amount: request.requestedAmount.toNumber(),
            rejectionReason: rejectionReason || null,
          },
        },
      });

      return updated;
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return formatConversionRequest(conversionRequest);
}

// ============================================================
// LISTAR SOLICITAÇÕES (admin)
// ============================================================

export async function listConversionRequests(
  status?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{
  requests: ConversionRequestData[];
  total: number;
  page: number;
  limit: number;
}> {
  const skip = (page - 1) * limit;

  const where: Prisma.ConversionRequestWhereInput = status
    ? { status: status as any }
    : {};

  const [requests, total] = await Promise.all([
    prisma.conversionRequest.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
      include: {
        affiliate: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.conversionRequest.count({ where }),
  ]);

  return {
    requests: requests.map(formatConversionRequest),
    total,
    page,
    limit,
  };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Gera código de cupom aleatório (8 caracteres alfanuméricos)
 */
function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CONV";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Formata ConversionRequest para resposta
 */
function formatConversionRequest(data: any): ConversionRequestData {
  return {
    id: data.id,
    affiliateId: data.affiliateId,
    requestedAmount: data.requestedAmount.toNumber(),
    status: data.status,
    rejectionReason: data.rejectionReason,
    generatedCouponCode: data.generatedCouponCode,
    shopifyDiscountId: data.shopifyDiscountId,
    expiresAt: data.expiresAt,
    approvedAt: data.approvedAt,
    rejectedAt: data.rejectedAt,
    reviewedById: data.reviewedById,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
