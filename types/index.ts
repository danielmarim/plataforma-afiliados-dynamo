import type { UserRole } from "@prisma/client";

/**
 * Resposta padrão de Server Actions.
 */
export type ActionResponse<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Usuário da sessão (dados expostos pelo NextAuth).
 */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

/**
 * Parâmetros de paginação padrão para listagens.
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

/**
 * Resultado paginado padrão.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
