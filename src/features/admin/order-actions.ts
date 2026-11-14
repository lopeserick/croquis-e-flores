"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { isValidIsoDate } from "@/features/orders/dates";
import { notifyArtist } from "@/features/orders/notify";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";
import { isOrderStatus, STATUS_LABELS } from "./order-status";
import { centsToInput, formatShortDate, parseReais } from "./format";

// Ações da página do pedido. Cada uma confere o admin de novo (uma Server
// Action pode ser chamada direto, sem passar pela página) e grava com a sessão
// dele, sob o RLS. Toda mudança fica no histórico (order_events).

export type ActionState = { ok: boolean; message: string } | null;

const NOTE_LIMIT = 2000;
const orderIdSchema = z.uuid();

async function loadOrder(formData: FormData) {
  const id = orderIdSchema.safeParse(formData.get("orderId"));
  if (!id.success) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, quote_cents, confirmed_deadline")
    .eq("id", id.data)
    .maybeSingle();
  return data ? { supabase, order: data } : null;
}

const notFound: ActionState = { ok: false, message: "Pedido não encontrado." };
const saveFailed: ActionState = { ok: false, message: "Não foi possível salvar. Tente de novo." };

export async function updateOrderStatus(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const status = formData.get("status");
  if (!isOrderStatus(status)) return { ok: false, message: "Escolha um status." };
  const loaded = await loadOrder(formData);
  if (!loaded) return notFound;
  const { supabase, order } = loaded;
  if (order.status === status) return { ok: true, message: `O pedido já está como "${STATUS_LABELS[status]}".` };

  const updated = await supabase.from("orders").update({ status }).eq("id", order.id);
  if (updated.error) return saveFailed;
  await supabase.from("order_events").insert({
    order_id: order.id,
    type: "status",
    from_status: order.status,
    to_status: status,
    author_id: admin.id,
  });
  refresh();
  return { ok: true, message: `Status alterado para "${STATUS_LABELS[status]}".` };
}

export async function addOrderNote(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const text = String(formData.get("note") ?? "").trim();
  if (text.length === 0) return { ok: false, message: "Escreva a anotação." };
  if (text.length > NOTE_LIMIT) return { ok: false, message: `Use até ${NOTE_LIMIT} caracteres.` };
  const loaded = await loadOrder(formData);
  if (!loaded) return notFound;

  const inserted = await loaded.supabase
    .from("order_events")
    .insert({ order_id: loaded.order.id, type: "nota", body: text, author_id: admin.id });
  if (inserted.error) return saveFailed;
  refresh();
  return { ok: true, message: "Anotação salva." };
}

export async function saveOrderQuote(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const quote = parseReais(String(formData.get("quote") ?? ""));
  if (quote === undefined) return { ok: false, message: "Valor inválido. Use o formato 150,00." };
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  if (deadline && !isValidIsoDate(deadline)) return { ok: false, message: "Data do prazo inválida." };
  const loaded = await loadOrder(formData);
  if (!loaded) return notFound;
  const { supabase, order } = loaded;

  const changes: string[] = [];
  if (quote !== order.quote_cents) {
    changes.push(quote === null ? "Orçamento apagado." : `Orçamento: R$ ${centsToInput(quote)}.`);
  }
  if (deadline !== order.confirmed_deadline) {
    changes.push(deadline === null ? "Prazo apagado." : `Prazo confirmado: ${formatShortDate(deadline)}.`);
  }
  if (changes.length === 0) return { ok: true, message: "Nada mudou." };

  const updated = await supabase
    .from("orders")
    .update({ quote_cents: quote, confirmed_deadline: deadline })
    .eq("id", order.id);
  if (updated.error) return saveFailed;
  await supabase
    .from("order_events")
    .insert({ order_id: order.id, type: "nota", body: changes.join(" "), author_id: admin.id });
  refresh();
  return { ok: true, message: "Orçamento e prazo salvos." };
}

export async function resendOrderEmail(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const loaded = await loadOrder(formData);
  if (!loaded) return notFound;
  const { sent } = await notifyArtist(loaded.order.id, admin.id);
  refresh();
  return sent
    ? { ok: true, message: "E-mail reenviado." }
    : { ok: false, message: "O e-mail não foi enviado. O motivo está no histórico." };
}
