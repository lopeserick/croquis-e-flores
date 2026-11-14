import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyRetention, cleanAbandonedReferences, cleanUnusedGalleryFiles, retryEmails } from "@/features/maintenance/run";
import { createAdminClient } from "@/lib/supabase/server";

// Rotina diária (entrega 10) contra o Supabase de desenvolvimento. Cada tarefa
// recebe `only` com o que o teste criou: nada mais do banco é tocado. O "agora"
// é adiantado em 2 dias para simular arquivos e pedidos antigos.

// Sem chave do Resend: o reenvio falha de propósito (nenhum e-mail sai do teste).
process.env.RESEND_API_KEY = "";

const db = createAdminClient();
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const inTwoDays = () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const keys: string[] = [];

async function createOrder(withPhoto: boolean) {
  const key = randomUUID();
  keys.push(key);
  const path = `${key}/1-e2e0000000000000.png`;
  if (withPhoto) {
    const upload = await db.storage.from("referencias").upload(path, PNG, { contentType: "image/png" });
    if (upload.error) throw upload.error;
  }
  const { data, error } = await db.rpc("create_order", {
    p_order: {
      idempotency_key: key,
      description: "teste da rotina de manutenção",
      customer_name: "Teste Manutenção",
      customer_email: "teste@exemplo.com",
      customer_whatsapp: "75988498356",
      city: "Feira de Santana",
      state: "BA",
      privacy_version: "teste",
      choices: { obra: [["Modalidade", "Teste"]] },
    },
    p_references: withPhoto
      ? [{ storage_path: path, original_name: "foto.png", mime_type: "image/png", size_bytes: PNG.length }]
      : [],
  });
  if (error) throw error;
  return { id: data[0].order_id as string, key, path };
}

afterAll(async () => {
  for (const key of keys) {
    const { data: files } = await db.storage.from("referencias").list(key);
    if (files?.length) await db.storage.from("referencias").remove(files.map((f) => `${key}/${f.name}`));
  }
  if (keys.length > 0) await db.from("orders").delete().in("idempotency_key", keys);
});

describe("fotos de pedidos abandonados", () => {
  it("apaga a pasta sem pedido depois de 24 h, e não a de um pedido registrado", async () => {
    const abandoned = randomUUID();
    keys.push(abandoned);
    await db.storage.from("referencias").upload(`${abandoned}/1-0000000000000000.png`, PNG, { contentType: "image/png" });
    const order = await createOrder(true);

    // Agora: ainda pode ser um envio em andamento.
    expect(await cleanAbandonedReferences(db, new Date(), new Set([abandoned, order.key]))).toEqual({ pastasDeFotosApagadas: 0 });

    const report = await cleanAbandonedReferences(db, inTwoDays(), new Set([abandoned, order.key]));
    expect(report).toEqual({ pastasDeFotosApagadas: 1 });
    expect((await db.storage.from("referencias").list(abandoned)).data).toEqual([]);
    expect((await db.storage.from("referencias").list(order.key)).data).toHaveLength(1);
  });
});

describe("fotos da galeria sem uso", () => {
  it("apaga a foto enviada e não salva; mantém a que uma obra usa", async () => {
    const owner = `teste-${randomUUID().slice(0, 8)}`;
    const unused = `obras/${owner}/0123456789abcdef.png`;
    await db.storage.from("obras").upload(unused, PNG, { contentType: "image/png" });
    const { data: inUse } = await db.from("artwork_images").select("path").limit(1).single();
    try {
      const report = await cleanUnusedGalleryFiles(db, inTwoDays(), new Set([unused, inUse!.path]));
      expect(report).toEqual({ fotosDaGaleriaApagadas: 1 });
      expect((await db.storage.from("obras").list(`obras/${owner}`)).data).toEqual([]);
    } finally {
      await db.storage.from("obras").remove([unused]);
    }
  });
});

describe("retenção das fotos dos clientes", () => {
  let previous: unknown;
  beforeAll(async () => {
    previous = (await db.from("settings").select("value").eq("key", "retention").single()).data!.value;
  });
  afterAll(async () => {
    await db.from("settings").update({ value: previous as { referenceDays: null } }).eq("key", "retention");
  });

  it("desligada (sem prazo), não apaga nada", async () => {
    await db.from("settings").update({ value: { referenceDays: null } }).eq("key", "retention");
    expect(await applyRetention(db, inTwoDays())).toEqual({ retencao: "desligada" });
  });

  it("com prazo, apaga as fotos de pedido concluído antigo, anota no histórico e mantém o pedido", async () => {
    await db.from("settings").update({ value: { referenceDays: 1 } }).eq("key", "retention");
    const done = await createOrder(true);
    const open = await createOrder(true);
    await db.from("orders").update({ status: "concluido" }).eq("id", done.id);
    const only = new Set([done.id, open.id]);

    expect(await applyRetention(db, new Date(), only)).toEqual({ pedidosComFotosApagadas: 0 });
    expect(await applyRetention(db, inTwoDays(), only)).toEqual({ pedidosComFotosApagadas: 1 });

    const { data: after } = await db
      .from("orders")
      .select("id, order_references(id), order_events(type, body)")
      .in("id", [done.id, open.id]);
    const doneRow = after!.find((o) => o.id === done.id)!;
    const openRow = after!.find((o) => o.id === open.id)!;
    expect(doneRow.order_references).toEqual([]);
    expect(doneRow.order_events.some((e) => /apagadas automaticamente/.test(e.body ?? ""))).toBe(true);
    expect(openRow.order_references).toHaveLength(1); // pedido em andamento: fotos ficam
    expect((await db.storage.from("referencias").list(done.key)).data).toEqual([]);
  });
});

describe("reenvio de e-mails", () => {
  it("tenta de novo o e-mail que falhou, até 3 vezes no total", async () => {
    const order = await createOrder(false);
    await db.from("orders").update({ email_status: "falhou" }).eq("id", order.id);
    const only = new Set([order.id]);

    for (let attempt = 1; attempt <= 3; attempt++) {
      expect(await retryEmails(db, new Date(), only)).toEqual({ emailsTentados: 1, emailsEnviados: 0 });
    }
    // Já são 3 falhas registradas: para de tentar.
    expect(await retryEmails(db, new Date(), only)).toEqual({ emailsTentados: 0, emailsEnviados: 0 });
    const { data } = await db.from("order_events").select("type").eq("order_id", order.id).eq("type", "email_falhou");
    expect(data).toHaveLength(3);
  });
});
