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
  await admin.from("rate_limits").delete().or("key.like.pedido:%,key.like.upload:%,key.like.login:%");
}

export type TestUser = { id: string; email: string; password: string };

/** Conta de teste (com acesso ao painel se `adminName` for dado). Apague com deleteUser. */
export async function createUser(adminName?: string): Promise<TestUser> {
  const email = `e2e-painel-${crypto.randomUUID().slice(0, 8)}@exemplo.com`;
  const password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  if (adminName) {
    const grant = await admin.from("admin_users").insert({ user_id: data.user.id, name: adminName });
    if (grant.error) throw grant.error;
  }
  return { id: data.user.id, email, password };
}

export async function deleteUser(user: TestUser | undefined) {
  if (user) await admin.auth.admin.deleteUser(user.id);
}

/** Pedido de teste com uma foto no bucket privado, gravado pela mesma função do site. */
export async function createTestOrder(customerEmail: string, photo: Buffer) {
  const key = crypto.randomUUID();
  const path = `${key}/1-e2e0000000000000.png`;
  const upload = await admin.storage.from("referencias").upload(path, photo, { contentType: "image/png" });
  if (upload.error) throw upload.error;
  const { data, error } = await admin.rpc("create_order", {
    p_order: {
      idempotency_key: key,
      description: "Retrato da família no quintal, em tons quentes.",
      customer_name: "Cliente Teste Painel",
      customer_email: customerEmail,
      customer_whatsapp: "11912345678",
      city: "Salvador",
      state: "BA",
      desired_date: "2027-03-15",
      privacy_version: "teste",
      choices: { obra: [["Modalidade", "Ilustração digital"], ["Tipo de arte", "Retratos"]], detalhes: [["Tamanho", "A4 (R$ 80)"]] },
    },
    p_references: [{ storage_path: path, original_name: "familia.png", mime_type: "image/png", size_bytes: photo.length }],
  });
  if (error) throw error;
  return { id: data[0].order_id, number: data[0].order_number };
}
