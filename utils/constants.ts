/**
 * Constantes globais da Plataforma de Afiliados Dynamo.
 */

export const APP_NAME = "Dynamo Afiliados";

export const APP_DESCRIPTION =
  "Plataforma de gestão de afiliados e parceiros integrada à Shopify.";

/** Rotas públicas (não exigem autenticação). */
export const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

/** Rota padrão após login. */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/** Prefixo das rotas de API de autenticação. */
export const API_AUTH_PREFIX = "/api/auth";

/**
 * Regras de comissão (valores de referência; a lógica de negócio
 * será implementada posteriormente).
 * Comissão padrão: 10%. Progressão para 15% ao fechar 10 vendas
 * com cupom dentro do mês, aplicada no fechamento do mês.
 */
export const COMMISSION = {
  DEFAULT_RATE: 10,
  UPGRADED_RATE: 15,
  SALES_TARGET_FOR_UPGRADE: 10,
} as const;
