import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminClient, createPublicClient } from "@/lib/supabase/server";

// Registro do pedido (entrega 6): funções create_order e hit_rate_limit.
// Pedidos de teste usam chaves novas e são apagados no fim.

const admin = createAdminClient();
const anon = createPublicClient();
const keys: string[] = [];
const rateKey = `teste:${randomUUID()}`;

function orderPayload(key: string) {
  keys.push(key);
  return {
    idempotency_key: key,
    description: "teste de create_order",
    customer_name: "Teste Pedido",
    customer_email: "teste@exemplo.com",
    customer_whatsapp: "75988498356",
    city: "Feira de Santana",
    state: "BA",
    privacy_version: "teste",
    choices: { obra: [["Modalidade", "Teste"]] },
  };
}

afterAll(async () => {
  if (keys.length > 0) await admin.from("orders").delete().in("idempotency_key", keys);
  await admin.from("rate_limits").delete().eq("key", rateKey);
});

describe("create_order", () => {
  it("visitante e público não chamam as funções do pedido", async () => {
    const created = await anon.rpc("create_order", { p_order: orderPayload(randomUUID()), p_references: [] });
    expect(created.error).not.toBeNull();
    const limited = await anon.rpc("hit_rate_limit", { p_key: rateKey, p_window_seconds: 60, p_max: 1 });
    expect(limited.error).not.toBeNull();
  });

  it("grava pedido, fotos e evento numa vez, com número CF-AAAA-NNNN", async () => {
    const key = randomUUID();
    const { data, error } = await admin.rpc("create_order", {
      p_order: orderPayload(key),
      p_references: [
        { storage_path: `${key}/1-abcdef12.png`, original_name: "foto.png", mime_type: "image/png", size_bytes: 70 },
      ],
    });
    expect(error).toBeNull();
    const saved = data![0];
    expect(saved.created).toBe(true);
    expect(saved.order_number).toMatch(/^CF-\d{4}-\d{4,}$/);

    const order = await admin.from("orders").select("status, email_status, privacy_accepted_at").eq("id", saved.order_id).single();
    expect(order.data).toMatchObject({ status: "nova", email_status: "pendente" });
    expect(order.data!.privacy_accepted_at).not.toBeNull();

    const refs = await admin.from("order_references").select("original_name").eq("order_id", saved.order_id);
    expect(refs.data).toEqual([{ original_name: "foto.png" }]);
    const events = await admin.from("order_events").select("type, to_status").eq("order_id", saved.order_id);
    expect(events.data).toEqual([{ type: "criado", to_status: "nova" }]);
  });

  it("a mesma chave devolve o mesmo pedido, sem duplicar (duplo clique)", async () => {
    const payload = orderPayload(randomUUID());
    const [first, second] = await Promise.all([
      admin.rpc("create_order", { p_order: payload, p_references: [] }),
      admin.rpc("create_order", { p_order: payload, p_references: [] }),
    ]);
    expect(first.data![0].order_id).toBe(second.data![0].order_id);
    expect([first.data![0].created, second.data![0].created].sort()).toEqual([false, true]);
    const count = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", payload.idempotency_key);
    expect(count.count).toBe(1);
  });

  it("números seguem em sequência", async () => {
    const a = await admin.rpc("create_order", { p_order: orderPayload(randomUUID()), p_references: [] });
    const b = await admin.rpc("create_order", { p_order: orderPayload(randomUUID()), p_references: [] });
    const seq = (n: string) => Number(n.split("-")[2]);
    expect(seq(b.data![0].order_number)).toBeGreaterThan(seq(a.data![0].order_number));
  });

  it("e-mail que recebe os pedidos é configuração privada", async () => {
    const visible = await anon.from("settings").select("key").eq("key", "notifications");
    expect(visible.data ?? []).toHaveLength(0);
    const stored = await admin.from("settings").select("value").eq("key", "notifications").single();
    expect(stored.data?.value).toHaveProperty("orderEmail");
  });
});

describe("hit_rate_limit", () => {
  it("libera até o limite e bloqueia depois", async () => {
    const hit = () => admin.rpc("hit_rate_limit", { p_key: rateKey, p_window_seconds: 3600, p_max: 2 });
    expect((await hit()).data).toBe(true);
    expect((await hit()).data).toBe(true);
    expect((await hit()).data).toBe(false);
  });
});
