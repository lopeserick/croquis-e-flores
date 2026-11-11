import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient, createPublicClient } from "@/lib/supabase/server";

// Quem não é a Carla (visitante anônimo ou alguém logado sem ser admin) só
// enxerga o que está publicado, e não escreve nada.

const admin = createAdminClient();
const anon = createPublicClient();
const suffix = randomUUID().slice(0, 8);

type Result = { data: unknown[] | null; error: unknown };

/** Bloqueado = erro de permissão ou nenhuma linha visível. */
function expectNothingVisible(result: Result) {
  if (result.error) return;
  expect(result.data ?? []).toHaveLength(0);
}

// Dados de teste criados com a chave secreta e apagados no fim.
let orderId = "";
let draftArtworkSlug = "";
const privateSettingKey = `teste_${suffix}`;
const referencePath = `teste/${suffix}.png`;
// PNG de 1×1 px.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

beforeAll(async () => {
  const order = await admin
    .from("orders")
    .insert({
      number: `CF-2099-${Math.floor(Math.random() * 1e6).toString().padStart(6, "0")}`,
      idempotency_key: randomUUID(),
      description: "teste de RLS",
      customer_name: "Teste",
      customer_email: "teste@exemplo.com",
      customer_whatsapp: "5500000000000",
      city: "Teste",
      state: "BA",
      privacy_accepted_at: new Date().toISOString(),
      privacy_version: "teste",
    })
    .select("id")
    .single();
  if (order.error) throw order.error;
  orderId = order.data.id;

  const { data: anyArtwork } = await admin.from("artworks").select("category_id, modality_id").limit(1).single();
  draftArtworkSlug = `teste-rascunho-${suffix}`;
  const draft = await admin.from("artworks").insert({
    slug: draftArtworkSlug,
    title: "Obra em rascunho",
    category_id: anyArtwork!.category_id,
    modality_id: anyArtwork!.modality_id,
    status: "rascunho",
  });
  if (draft.error) throw draft.error;

  const setting = await admin.from("settings").insert({ key: privateSettingKey, value: { segredo: true } });
  if (setting.error) throw setting.error;

  const upload = await admin.storage.from("referencias").upload(referencePath, png, { contentType: "image/png" });
  if (upload.error) throw upload.error;
});

afterAll(async () => {
  if (orderId) await admin.from("orders").delete().eq("id", orderId);
  await admin.from("artworks").delete().eq("slug", draftArtworkSlug);
  await admin.from("settings").delete().eq("key", privateSettingKey);
  await admin.storage.from("referencias").remove([referencePath]);
});

describe("visitante anônimo", () => {
  it("lê as obras publicadas e o catálogo ativo", async () => {
    const artworks = await anon.from("artworks").select("slug, status");
    expect(artworks.error).toBeNull();
    expect(artworks.data!.length).toBeGreaterThan(0);
    expect(artworks.data!.every((a) => a.status === "publicada")).toBe(true);

    const categories = await anon.from("categories").select("slug");
    expect(categories.data!.length).toBeGreaterThan(0);
  });

  it("não vê obra em rascunho", async () => {
    expectNothingVisible(await anon.from("artworks").select("id").eq("slug", draftArtworkSlug));
  });

  it("não lê pedidos, referências, histórico nem tabelas internas", async () => {
    expectNothingVisible(await anon.from("orders").select("id"));
    expectNothingVisible(await anon.from("order_references").select("id"));
    expectNothingVisible(await anon.from("order_events").select("id"));
    expectNothingVisible(await anon.from("admin_users").select("user_id"));
    expectNothingVisible(await anon.from("order_counters").select("year"));
    expectNothingVisible(await anon.from("rate_limits").select("key"));
  });

  it("não cria pedido direto pela API", async () => {
    const { error } = await anon.from("orders").insert({
      number: "CF-2099-9999",
      idempotency_key: randomUUID(),
      description: "tentativa",
      customer_name: "X",
      customer_email: "x@exemplo.com",
      customer_whatsapp: "5500000000000",
      city: "X",
      state: "BA",
      privacy_accepted_at: new Date().toISOString(),
      privacy_version: "x",
    });
    expect(error).not.toBeNull();
  });

  it("não altera nem apaga obras", async () => {
    const { data: before } = await admin.from("artworks").select("id, title").eq("status", "publicada").limit(1).single();
    await anon.from("artworks").update({ title: "invadido" }).eq("id", before!.id);
    await anon.from("artworks").delete().eq("id", before!.id);
    const { data: after } = await admin.from("artworks").select("title").eq("id", before!.id).single();
    expect(after!.title).toBe(before!.title);
  });

  it("só vê configurações públicas", async () => {
    expectNothingVisible(await anon.from("settings").select("key").eq("key", privateSettingKey));
    const publicKeys = await anon.from("settings").select("key");
    expect(publicKeys.data!.map((s) => s.key).sort()).toEqual(["about", "home", "order_form", "site"]);
  });

  it("não lista, não baixa e não envia fotos de clientes", async () => {
    const list = await anon.storage.from("referencias").list("teste");
    expect(list.data ?? []).toHaveLength(0);

    const download = await anon.storage.from("referencias").download(referencePath);
    expect(download.error).not.toBeNull();

    const upload = await anon.storage.from("referencias").upload(`teste/anon-${suffix}.png`, png, {
      contentType: "image/png",
    });
    expect(upload.error).not.toBeNull();
  });

  it("foto de cliente não abre por endereço público", async () => {
    const { data } = anon.storage.from("referencias").getPublicUrl(referencePath);
    const response = await fetch(data.publicUrl);
    expect(response.ok).toBe(false);
  });

  it("não consegue criar conta (cadastro público desligado)", async () => {
    const { data, error } = await anon.auth.signUp({
      email: `teste-cadastro-${suffix}@exemplo.com`,
      password: randomUUID(),
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it("não envia fotos para a galeria", async () => {
    const upload = await anon.storage.from("obras").upload(`teste/anon-${suffix}.png`, png, {
      contentType: "image/png",
    });
    expect(upload.error).not.toBeNull();
  });
});

describe("usuário logado que não é admin", () => {
  const email = `teste-${suffix}@exemplo.com`;
  const password = randomUUID();
  let userId = "";
  const user = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  beforeAll(async () => {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
  });

  afterAll(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("não lê pedidos nem obras em rascunho", async () => {
    expectNothingVisible(await user.from("orders").select("id"));
    expectNothingVisible(await user.from("artworks").select("id").eq("slug", draftArtworkSlug));
  });

  it("não altera o catálogo nem as configurações", async () => {
    const { data: before } = await admin.from("settings").select("value").eq("key", "site").single();
    await user.from("settings").update({ value: { invadido: true } }).eq("key", "site");
    const { data: after } = await admin.from("settings").select("value").eq("key", "site").single();
    expect(after!.value).toEqual(before!.value);

    const insert = await user.from("categories").insert({
      slug: `teste-${suffix}`,
      name: "Invasão",
      image: { path: "/x.jpg", alt: "x", width: 1, height: 1, focalX: 50, focalY: 50 },
    });
    expect(insert.error).not.toBeNull();
  });

  it("não lê fotos de clientes", async () => {
    const download = await user.storage.from("referencias").download(referencePath);
    expect(download.error).not.toBeNull();
  });
});

describe("regras do banco", () => {
  it("bucket de referências é privado e o da galeria é público", async () => {
    const referencias = await admin.storage.getBucket("referencias");
    const obras = await admin.storage.getBucket("obras");
    expect(referencias.data?.public).toBe(false);
    expect(obras.data?.public).toBe(true);
  });

  it("referências só aceitam imagem JPG, PNG ou WebP", async () => {
    const upload = await admin.storage
      .from("referencias")
      .upload(`teste/${suffix}.txt`, Buffer.from("não sou imagem"), { contentType: "text/plain" });
    expect(upload.error).not.toBeNull();
  });

  it("depoimento real não é publicado sem a autorização registrada", async () => {
    const { error } = await admin.from("testimonials").insert({
      name: "Cliente",
      body: "Texto",
      published: true,
      is_demo: false,
    });
    expect(error?.code).toBe("23514");
  });

  it("obra tem no máximo uma foto de capa", async () => {
    const { data: artwork } = await admin.from("artworks").select("id").eq("slug", draftArtworkSlug).single();
    const image = { artwork_id: artwork!.id, path: "/x.jpg", alt: "x", width: 1, height: 1, is_cover: true };
    expect((await admin.from("artwork_images").insert(image)).error).toBeNull();
    expect((await admin.from("artwork_images").insert(image)).error?.code).toBe("23505");
  });

  it("categoria com foto inválida é recusada", async () => {
    const { error } = await admin.from("categories").insert({
      slug: `teste-${suffix}`,
      name: "Teste",
      image: { path: "/x.jpg", alt: "" },
    });
    expect(error?.code).toBe("23514");
  });
});
