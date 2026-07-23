import { z } from "zod";

/**
 * Schema para solicitar conversão de comissão em cupom
 */
export const requestConversionSchema = z.object({
  requestedAmount: z
    .number()
    .positive("O valor deve ser maior que zero.")
    .max(999999.99, "O valor máximo é R$ 999.999,99"),
});

/**
 * Schema para aprovar solicitação de conversão
 */
export const approveConversionSchema = z.object({
  conversionRequestId: z.string().cuid("ID inválido."),
});

/**
 * Schema para rejeitar solicitação de conversão
 */
export const rejectConversionSchema = z.object({
  conversionRequestId: z.string().cuid("ID inválido."),
  rejectionReason: z
    .string()
    .max(500, "O motivo deve ter no máximo 500 caracteres.")
    .optional(),
});

/**
 * Schema para filtrar solicitações de conversão (admin)
 */
export const conversionFilterSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(["createdAt", "requestedAmount", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type RequestConversionInput = z.infer<
  typeof requestConversionSchema
>;
export type ApproveConversionInput = z.infer<
  typeof approveConversionSchema
>;
export type RejectConversionInput = z.infer<
  typeof rejectConversionSchema
>;
export type ConversionFilterInput = z.infer<
  typeof conversionFilterSchema
>;
