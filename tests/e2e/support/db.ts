import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Acesso ao banco de DESENVOLVIMENTO pelos testes de navegador: conferir o que
// o envio gravou e apagar os pedidos de teste. Não importa src/lib/supabase
// (marcado como server-only).

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** Pedidos do cliente de teste, com fotos e eventos. */
export async function ordersOf(email: string) {
  const { data, error } = await admin
    .from("orders")
    .select("id, number, idempotency_key, email_status, customer_whatsapp, choices, order_references(storage_path, mime_type), order_events(type)")
    .eq("customer_email", email);
  if (error) throw error;
  return data;
}

/** Apaga os pedidos do cliente de teste e as fotos que ele enviou. */
export async function deleteOrdersOf(email: string) {
  for (const order of await ordersOf(email)) {
    const { data: files } = await admin.storage.from("referencias").list(order.idempotency_key);
    const paths = (files ?? []).map((f) => `${order.idempotency_key}/${f.name}`);
    if (paths.length > 0) await admin.storage.from("referencias").remove(paths);
    await admin.from("orders").delete().eq("id", order.id);
  }
}

/** Os testes enviam vários pedidos do mesmo IP: zera o limite de tentativas. */
export async function resetRateLimits() {
  await admin.from("rate_limits").delete().or("key.like.pedido:%,key.like.upload:%");
}
