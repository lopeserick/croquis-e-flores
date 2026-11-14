import "server-only";
import { parseGalleryPath } from "@/features/admin/gallery-images";
import { retentionSchema } from "@/features/admin/settings-forms";
import { GALLERY_BUCKET, GALLERY_FOLDERS } from "@/features/catalog/image-url";
import { notifyArtist } from "@/features/orders/notify";
import { createAdminClient } from "@/lib/supabase/server";
import {
  emailRetryCandidates,
  imagePathsIn,
  isAbandonedReferenceFolder,
  isUnusedGalleryFile,
  retentionCutoff,
} from "./rules";

// Rotina diária (Vercel Cron → /api/cron/manutencao). Usa a chave secreta do
// Supabase: a rota só chega aqui depois de conferir o CRON_SECRET. Cada tarefa
// roda separada; a falha de uma não impede as outras. O resumo não tem dados
// pessoais (só contagens). `only` (testes): limita a tarefa a estes pedidos,
// pastas ou arquivos, para não mexer em mais nada do banco de desenvolvimento.

const REFERENCES_BUCKET = "referencias";
const LIST_LIMIT = 1000;

export type MaintenanceReport = Record<string, number | string>;

type Db = ReturnType<typeof createAdminClient>;

/** 1. E-mails de pedido que falharam (ou ficaram pendentes): tenta de novo, até 3 vezes no total. */
export async function retryEmails(db: Db, now: Date, only?: ReadonlySet<string>): Promise<MaintenanceReport> {
  const { data, error } = await db
    .from("orders")
    .select("id, email_status, created_at, order_events(type)")
    .neq("email_status", "enviado")
    .gte("created_at", new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString());
  if (error) throw error;
  const ids = emailRetryCandidates(
    data.filter((o) => !only || only.has(o.id)).map((o) => ({
      id: o.id,
      emailStatus: o.email_status,
      createdAt: o.created_at,
      failures: o.order_events.filter((e) => e.type === "email_falhou").length,
    })),
    now,
  );
  let sent = 0;
  for (const id of ids) if ((await notifyArtist(id)).sent) sent++;
  return { emailsTentados: ids.length, emailsEnviados: sent };
}

/** 2. Fotos de clientes que desistiram no meio do envio (pasta sem pedido há mais de 24 h). */
export async function cleanAbandonedReferences(db: Db, now: Date, only?: ReadonlySet<string>): Promise<MaintenanceReport> {
  const bucket = db.storage.from(REFERENCES_BUCKET);
  const { data: folders, error } = await bucket.list("", { limit: LIST_LIMIT });
  if (error) throw error;
  const keys = folders.filter((f) => f.id === null && (!only || only.has(f.name))).map((f) => f.name);
  if (keys.length === 0) return { pastasDeFotosApagadas: 0 };

  const { data: orders, error: ordersError } = await db.from("orders").select("idempotency_key").in("idempotency_key", keys);
  if (ordersError) throw ordersError;
  const orderKeys = new Set(orders.map((o) => o.idempotency_key));

  let removed = 0;
  for (const key of keys.filter((k) => !orderKeys.has(k))) {
    const { data: files } = await bucket.list(key, { limit: LIST_LIMIT });
    const list = (files ?? []).filter((f) => f.id !== null);
    const newest = list.map((f) => f.created_at).sort().at(-1) ?? null;
    if (!isAbandonedReferenceFolder({ key, newestFileAt: newest }, orderKeys, now)) continue;
    if (list.length > 0) await bucket.remove(list.map((f) => `${key}/${f.name}`));
    removed++;
  }
  return { pastasDeFotosApagadas: removed };
}

/** 3. Fotos da galeria enviadas pelo painel e não usadas (ex.: trocou a foto e não salvou). */
export async function cleanUnusedGalleryFiles(db: Db, now: Date, only?: ReadonlySet<string>): Promise<MaintenanceReport> {
  const [images, categories, modalities, settings] = await Promise.all([
    db.from("artwork_images").select("path"),
    db.from("categories").select("image"),
    db.from("modalities").select("image"),
    db.from("settings").select("value"),
  ]);
  if (images.error || categories.error || modalities.error || settings.error) {
    throw new Error("não foi possível ler as fotos em uso");
  }
  const used = new Set(images.data.map((i) => i.path));
  for (const row of [...categories.data.map((c) => c.image), ...modalities.data.map((m) => m.image), ...settings.data.map((s) => s.value)]) {
    imagePathsIn(row, used);
  }

  const bucket = db.storage.from(GALLERY_BUCKET);
  const unused: string[] = [];
  for (const folder of GALLERY_FOLDERS) {
    const { data: owners } = await bucket.list(folder, { limit: LIST_LIMIT });
    for (const owner of (owners ?? []).filter((o) => o.id === null)) {
      const { data: files } = await bucket.list(`${folder}/${owner.name}`, { limit: LIST_LIMIT });
      for (const file of (files ?? []).filter((f) => f.id !== null)) {
        const path = `${folder}/${owner.name}/${file.name}`;
        // Só arquivos com o formato de caminho que o painel gera.
        if ((!only || only.has(path)) && parseGalleryPath(path) && isUnusedGalleryFile({ path, createdAt: file.created_at }, used, now)) unused.push(path);
      }
    }
  }
  if (unused.length > 0) {
    const { error } = await bucket.remove(unused);
    if (error) throw error;
  }
  return { fotosDaGaleriaApagadas: unused.length };
}

/** 4. Retenção: apaga as fotos de referência de pedidos concluídos ou cancelados há mais de N dias. */
export async function applyRetention(db: Db, now: Date, only?: ReadonlySet<string>): Promise<MaintenanceReport> {
  const { data: setting } = await db.from("settings").select("value").eq("key", "retention").maybeSingle();
  const parsed = retentionSchema.safeParse(setting?.value);
  const cutoff = retentionCutoff(parsed.success ? parsed.data.referenceDays : null, now);
  if (!cutoff || !parsed.success) return { retencao: "desligada" };

  const { data: orders, error } = await db
    .from("orders")
    .select("id, order_references(id, storage_path)")
    .in("status", ["concluido", "cancelado"])
    .lt("updated_at", cutoff.toISOString());
  if (error) throw error;

  let cleaned = 0;
  for (const order of orders.filter((o) => o.order_references.length > 0 && (!only || only.has(o.id)))) {
    const paths = order.order_references.map((r) => r.storage_path);
    const removed = await db.storage.from(REFERENCES_BUCKET).remove(paths);
    if (removed.error) continue;
    await db.from("order_references").delete().eq("order_id", order.id);
    await db.from("order_events").insert({
      order_id: order.id,
      type: "nota",
      body: `Fotos de referência apagadas automaticamente (guardadas por ${parsed.data.referenceDays} dias após o fim do pedido).`,
    });
    cleaned++;
  }
  return { pedidosComFotosApagadas: cleaned };
}

export async function runMaintenance(now = new Date()): Promise<MaintenanceReport> {
  const db = createAdminClient();
  const tasks: [string, (db: Db, now: Date) => Promise<MaintenanceReport>][] = [
    ["emails", retryEmails],
    ["referencias", cleanAbandonedReferences],
    ["galeria", cleanUnusedGalleryFiles],
    ["retencao", applyRetention],
  ];
  // As consultas acima também mantêm o Supabase gratuito ativo (ele pausa após 7 dias sem uso).
  const report: MaintenanceReport = {};
  for (const [name, task] of tasks) {
    try {
      Object.assign(report, await task(db, now));
    } catch (error) {
      console.error(`[manutenção] falha em "${name}"`, error instanceof Error ? error.message : error);
      report[`erro_${name}`] = "falhou";
    }
  }
  return report;
}
