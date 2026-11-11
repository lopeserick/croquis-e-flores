import "server-only";
import { randomBytes } from "node:crypto";
import { getSiteSettings } from "@/features/settings/site-settings";
import { detectImageType, SIGNATURE_BYTES } from "@/lib/security/file-signature";
import { requestIpHash } from "@/lib/security/request-ip";
import { withinRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { todayInSaoPaulo } from "./dates";
import { getOrderFormData, getOrderFormSettings } from "./form-data";
import type { OrderFormSettings } from "./form-types";
import { buildOrderRecord } from "./order-record";
import { notifyArtist } from "./notify";
import { firstIncompleteStep, isEmpty, parseDraft, sanitizeDraft, validateOrder } from "./schema";
import {
  isReferencePathFor,
  prepareUploadsSchema,
  referencePath,
  submitOrderSchema,
  type PrepareUploadsResult,
  type SubmitOrderResult,
} from "./submission";
import { summarizeOrder } from "./summary";
import { customerWhatsappLink } from "./whatsapp";

// Envio do pedido (docs/arquitetura.md, seção 7). Tudo o que chega do
// navegador é validado de novo aqui, com as mesmas regras do configurador.

const REFERENCES_BUCKET = "referencias";

const MESSAGES = {
  generic: "Não foi possível enviar a sua solicitação. Confira os dados e tente de novo.",
  tooMany: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  uploadSetup: "Não foi possível preparar o envio das fotos. Tente de novo em instantes.",
  save: "Não foi possível registrar o pedido agora. Seus dados continuam aqui: tente de novo em instantes.",
} as const;

// ---------------------------------------------------------------------------
// 1. Links de envio das fotos
// ---------------------------------------------------------------------------

export async function prepareUploads(raw: unknown): Promise<PrepareUploadsResult> {
  const parsed = prepareUploadsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: MESSAGES.uploadSetup };
  const { idempotencyKey, files } = parsed.data;

  const settings = await getOrderFormSettings();
  if (files.length > settings.maxFiles) return { ok: false, message: `Envie no máximo ${settings.maxFiles} fotos.` };
  const tooBig = files.find((f) => f.size > settings.maxFileSizeMb * 1024 * 1024);
  if (tooBig) return { ok: false, message: `"${tooBig.name}" passa de ${settings.maxFileSizeMb} MB.` };

  if (!(await withinRateLimit("upload", await requestIpHash()))) return { ok: false, message: MESSAGES.tooMany };

  const bucket = createAdminClient().storage.from(REFERENCES_BUCKET);
  const uploads: { path: string; url: string }[] = [];
  for (const [index, file] of files.entries()) {
    const path = referencePath(idempotencyKey, index + 1, file.type, randomBytes(8).toString("hex"));
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[pedido] falha ao criar link de envio", error?.message);
      return { ok: false, message: MESSAGES.uploadSetup };
    }
    uploads.push({ path, url: data.signedUrl });
  }
  return { ok: true, uploads };
}

// ---------------------------------------------------------------------------
// 2. Conferência das fotos que chegaram ao armazenamento
// ---------------------------------------------------------------------------

type CheckedReference = { storage_path: string; original_name: string; mime_type: string; size_bytes: number };

async function verifyReferences(
  idempotencyKey: string,
  references: { path: string; name: string }[],
  settings: OrderFormSettings,
): Promise<{ ok: true; references: CheckedReference[] } | { ok: false; message: string }> {
  if (references.length > settings.maxFiles) return { ok: false, message: `Envie no máximo ${settings.maxFiles} fotos.` };
  if (new Set(references.map((r) => r.path)).size !== references.length) return { ok: false, message: MESSAGES.generic };

  const bucket = createAdminClient().storage.from(REFERENCES_BUCKET);
  const checked: CheckedReference[] = [];
  for (const reference of references) {
    // Só caminhos que o servidor gerou para ESTE pedido.
    if (!isReferencePathFor(idempotencyKey, reference.path)) return { ok: false, message: MESSAGES.generic };

    const missing = { ok: false as const, message: `A foto "${reference.name}" não chegou. Tente enviar de novo.` };
    const info = await bucket.info(reference.path);
    const size = info.data?.size ?? 0;
    if (info.error || size <= 0) return missing;
    if (size > settings.maxFileSizeMb * 1024 * 1024) {
      await bucket.remove([reference.path]);
      return { ok: false, message: `"${reference.name}" passa de ${settings.maxFileSizeMb} MB.` };
    }

    // Tipo real pelos primeiros bytes (o tipo declarado no envio pode ser falso).
    const { data: read } = await bucket.createSignedUrl(reference.path, 60);
    if (!read) return missing;
    const head = await fetch(read.signedUrl, { headers: { range: `bytes=0-${SIGNATURE_BYTES - 1}` } });
    const mime = head.ok ? detectImageType(new Uint8Array(await head.arrayBuffer())) : null;
    if (!mime) {
      await bucket.remove([reference.path]);
      return { ok: false, message: `"${reference.name}" não é uma imagem válida (JPG, PNG ou WebP).` };
    }
    checked.push({
      storage_path: reference.path,
      original_name: reference.name.trim(),
      mime_type: mime,
      size_bytes: size,
    });
  }
  return { ok: true, references: checked };
}

// ---------------------------------------------------------------------------
// 3. Registro do pedido
// ---------------------------------------------------------------------------

export async function submitOrder(raw: unknown): Promise<SubmitOrderResult> {
  const parsed = submitOrderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: MESSAGES.generic };
  const { idempotencyKey, references, website } = parsed.data;

  // Robô preencheu o campo invisível: nada é gravado.
  if (website.trim() !== "") return { ok: false, message: MESSAGES.generic };

  const ipHash = await requestIpHash();
  if (!(await withinRateLimit("pedido", ipHash))) return { ok: false, message: MESSAGES.tooMany };

  const data = await getOrderFormData();
  const ctx = { data, today: todayInSaoPaulo() };
  const draft = sanitizeDraft(parseDraft(parsed.data.draft), ctx);
  if (!isEmpty(validateOrder(draft, ctx))) {
    return {
      ok: false,
      message: "Algumas informações do pedido precisam de ajuste.",
      step: firstIncompleteStep(draft, ctx),
    };
  }

  const checked = await verifyReferences(idempotencyKey, references, data.settings);
  if (!checked.ok) return checked;

  const summary = summarizeOrder(draft, ctx);
  const { data: rows, error } = await createAdminClient().rpc("create_order", {
    p_order: buildOrderRecord(draft, ctx, summary, { idempotencyKey, ipHash }),
    p_references: checked.references,
  });
  const saved = rows?.[0];
  if (error || !saved) {
    console.error("[pedido] falha ao gravar", error?.message);
    return { ok: false, message: MESSAGES.save };
  }

  // Reenvio da mesma chave (duplo clique, rede caiu): pedido e e-mail já existem.
  if (saved.created) await notifyArtist(saved.order_id);
  const site = await getSiteSettings();

  return {
    ok: true,
    number: saved.order_number,
    whatsappUrl: customerWhatsappLink(site.whatsappNumber, { number: saved.order_number, customerName: draft.name }),
  };
}
