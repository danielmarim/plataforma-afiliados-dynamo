import "server-only";

/**
 * Serviço de integração com a Shopify Admin API.
 * Esqueleto inicial — as operações (cupons, pedidos, webhooks)
 * serão implementadas na etapa de regras de negócio.
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-07";

/**
 * Executa uma requisição autenticada contra a Shopify Admin API (GraphQL).
 */
export async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
    throw new Error(
      "Variáveis de ambiente da Shopify não configuradas (SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_API_ACCESS_TOKEN)."
    );
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify Admin API: HTTP ${response.status}`);
  }

  const json = (await response.json()) as { data: T; errors?: unknown[] };

  if (json.errors?.length) {
    throw new Error(`Shopify Admin API: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export const shopifyService = {
  // createDiscountCode: será implementado na etapa de regras de negócio
  // getOrder: será implementado na etapa de regras de negócio
  // registerWebhooks: será implementado na etapa de regras de negócio
};
