import "server-only";
import { z } from "zod";
import { parseStoredSummary, type OrderSummary } from "@/features/orders/summary";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";
import { ORDER_STATUSES, type EmailStatus, type OrderEventType, type OrderStatus } from "./order-status";

// Leituras do painel de pedidos. Cada função confere o admin e lê com a
// sessão dele: o RLS do banco é a segunda barreira. Sem cache: dados pessoais
// e que mudam a todo momento.

export type OrderListItem = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  city: string;
  state: string;
  status: OrderStatus;
  emailStatus: EmailStatus;
  /** "Ilustração digital · Retratos" */
  headline: string;
};

const LIST_COLUMNS = "id, number, created_at, customer_name, city, state, status, email_status, choices";

type ListRow = {
  id: string;
  number: string;
  created_at: string;
  customer_name: string;
  city: string;
  state: string;
  status: OrderStatus;
  email_status: EmailStatus;
  choices: unknown;
};

function toListItem(row: ListRow): OrderListItem {
  const work = parseStoredSummary(row.choices).work;
  const value = (label: string) => work.find(([l]) => l === label)?.[1] ?? "";
  return {
    id: row.id,
    number: row.number,
    createdAt: row.created_at,
    customerName: row.customer_name,
    city: row.city,
    state: row.state,
    status: row.status,
    emailStatus: row.email_status,
    headline: [value("Modalidade"), value("Tipo de arte")].filter(Boolean).join(" · "),
  };
}

export type OrderFilter = { status: OrderStatus | null; emailFailed: boolean };

export async function listOrders(filter: OrderFilter, limit = 100): Promise<OrderListItem[]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  let query = supabase.from("orders").select(LIST_COLUMNS).order("created_at", { ascending: false }).limit(limit);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.emailFailed) query = query.eq("email_status", "falhou");
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar os pedidos: ${error.message}`);
  return (data as ListRow[]).map(toListItem);
}

export type OrderCounts = { byStatus: Record<OrderStatus, number>; total: number; emailFailed: number };

export async function getOrderCounts(): Promise<OrderCounts> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("orders").select("status, email_status");
  if (error) throw new Error(`Falha ao contar os pedidos: ${error.message}`);
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const row of data) byStatus[row.status] += 1;
  return { byStatus, total: data.length, emailFailed: data.filter((r) => r.email_status === "falhou").length };
}

export type OrderEvent = {
  id: string;
  type: OrderEventType;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  body: string | null;
  createdAt: string;
  /** Feito por alguém no painel (e não pelo site). */
  byAdmin: boolean;
};

export type OrderReference = { id: string; name: string; mimeType: string; sizeBytes: number };

export type OrderDetail = OrderListItem & {
  summary: OrderSummary;
  desiredDate: string | null;
  description: string;
  notes: string | null;
  customerEmail: string;
  /** Nacional, só dígitos. */
  customerWhatsapp: string;
  portfolioConsent: boolean;
  privacyAcceptedAt: string;
  privacyVersion: string;
  quoteCents: number | null;
  confirmedDeadline: string | null;
  inspiration: { title: string; slug: string } | null;
  references: OrderReference[];
  events: OrderEvent[];
};

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `${LIST_COLUMNS}, desired_date, description, notes, customer_email, customer_whatsapp, portfolio_consent,
       privacy_accepted_at, privacy_version, quote_cents, confirmed_deadline,
       artwork:artworks(title, slug),
       order_references(id, original_name, mime_type, size_bytes, created_at),
       order_events(id, type, from_status, to_status, body, created_at, author_id)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar o pedido: ${error.message}`);
  if (!data) return null;

  return {
    ...toListItem(data as ListRow),
    summary: parseStoredSummary(data.choices),
    desiredDate: data.desired_date,
    description: data.description,
    notes: data.notes,
    customerEmail: data.customer_email,
    customerWhatsapp: data.customer_whatsapp,
    portfolioConsent: data.portfolio_consent,
    privacyAcceptedAt: data.privacy_accepted_at,
    privacyVersion: data.privacy_version,
    quoteCents: data.quote_cents,
    confirmedDeadline: data.confirmed_deadline,
    inspiration: data.artwork,
    references: [...data.order_references]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((r) => ({ id: r.id, name: r.original_name, mimeType: r.mime_type, sizeBytes: r.size_bytes })),
    // Mais recentes primeiro.
    events: [...data.order_events]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((e) => ({
        id: e.id,
        type: e.type,
        fromStatus: e.from_status,
        toStatus: e.to_status,
        body: e.body,
        createdAt: e.created_at,
        byAdmin: e.author_id !== null,
      })),
  };
}
