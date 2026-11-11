import type { Database } from "@/lib/supabase/database.types";

// Nomes e formatos usados no painel de pedidos.

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderEventType = Database["public"]["Enums"]["order_event_type"];
export type EmailStatus = Database["public"]["Enums"]["email_status"];

/** Na ordem do andamento de um pedido (definidos com a Carla em 11/11/2026). */
export const ORDER_STATUSES: readonly OrderStatus[] = ["novo", "orcamento_enviado", "aprovado", "concluido", "cancelado"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: "Novo",
  orcamento_enviado: "Orçamento enviado",
  aprovado: "Aprovado (em produção)",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const EMAIL_LABELS: Record<EmailStatus, string> = {
  pendente: "E-mail pendente",
  enviado: "E-mail enviado",
  falhou: "E-mail não enviado",
};

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

/** "1.250,50", "R$ 90" ou "90" → centavos. Vazio → null. Inválido → undefined. */
export function parseReais(input: string): number | null | undefined {
  const text = input.replace(/R\$|\s/g, "");
  if (text === "") return null;
  // Formato brasileiro: ponto separa milhar, vírgula separa centavos.
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(text)) return undefined;
  const [whole, cents = ""] = text.replace(/\./g, "").split(",");
  const value = Number(whole) * 100 + Number(cents.padEnd(2, "0"));
  return value <= 100_000_000 ? value : undefined; // até R$ 1 milhão
}

/** Centavos → "1.250,50" (para preencher o campo). */
export function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026-11-11T17:30:00Z" → "11/11/2026, 14:30" (horário de São Paulo). */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "2026-12-20" → "20/12/2026" (data pura, sem fuso). */
export function formatShortDate(iso: string): string {
  return iso.split("-").reverse().join("/");
}
