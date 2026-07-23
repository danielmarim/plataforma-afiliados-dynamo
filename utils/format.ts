/**
 * Formata um valor numérico como moeda brasileira (BRL).
 */
export function formatCurrency(
  value: number | string,
  currency: string = "BRL"
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value));
}

/**
 * Formata uma data no padrão brasileiro (dd/mm/aaaa).
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(date));
}

/**
 * Formata data e hora no padrão brasileiro.
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

/**
 * Formata um percentual (ex.: 10 -> "10%").
 */
export function formatPercent(value: number | string): string {
  return `${Number(value).toLocaleString("pt-BR")}%`;
}

/**
 * Retorna as iniciais de um nome para uso em avatares.
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
