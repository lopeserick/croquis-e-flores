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
