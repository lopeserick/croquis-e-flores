import "server-only";
import { randomBytes } from "node:crypto";
import { GALLERY_BUCKET, isStoredImagePath, resolveImagePath, type GalleryFolder } from "@/features/catalog/image-url";
import { detectImageType, SIGNATURE_BYTES, type ImageMime } from "@/lib/security/file-signature";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";
import {
  galleryPath,
  galleryUploadSchema,
  isGalleryPathFor,
  MAX_GALLERY_IMAGE_MB,
  parseGalleryPath,
  storedImageSchema,
  type StoredImage,
} from "./gallery-images";

// Envio de fotos do painel para o bucket público "obras". A sessão da Carla
// assina o envio: as políticas do Storage só deixam admin gravar nesse bucket.

export type GalleryUploadResult = { ok: true; path: string; url: string } | { ok: false; message: string };

export async function createGalleryUpload(raw: unknown): Promise<GalleryUploadResult> {
  await requireAdmin();
  const parsed = galleryUploadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: `Envie uma foto JPG, PNG ou WebP de até ${MAX_GALLERY_IMAGE_MB} MB.` };
  }
  const { folder, owner, mime } = parsed.data;
  const path = galleryPath(folder, owner, mime, randomBytes(8).toString("hex"));
  const supabase = await createSessionClient();
  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[painel] falha ao preparar envio de foto", error?.message);
    return { ok: false, message: "Não foi possível preparar o envio da foto. Tente de novo." };
  }
  return { ok: true, path, url: data.signedUrl };
}

/**
 * Confere uma foto que o navegador diz ter enviado: o caminho é deste dono,
 * o arquivo existe e é mesmo uma imagem. Se não for, apaga o arquivo.
 */
export async function verifyGalleryImage(
  path: string,
  expected: { folder: GalleryFolder; owner: string },
): Promise<{ ok: true; mime: ImageMime } | { ok: false; message: string }> {
  if (!isGalleryPathFor(expected.folder, expected.owner, path)) return { ok: false, message: "Foto inválida." };
  const supabase = await createSessionClient();
  const bucket = supabase.storage.from(GALLERY_BUCKET);

  const info = await bucket.info(path);
  if (info.error || !info.data?.size) return { ok: false, message: "A foto não chegou. Tente enviar de novo." };

  const head = await fetch(resolveImagePath(path), {
    headers: { range: `bytes=0-${SIGNATURE_BYTES - 1}` },
    cache: "no-store",
  });
  const mime = head.ok ? detectImageType(new Uint8Array(await head.arrayBuffer())) : null;
  if (!mime) {
    await bucket.remove([path]);
    return { ok: false, message: "O arquivo não é uma imagem válida (JPG, PNG ou WebP)." };
  }
  return { ok: true, mime };
}

/** Apaga do bucket as fotos enviadas pelo painel (ignora as da pasta public/). */
export async function removeGalleryFiles(paths: (string | null | undefined)[]): Promise<void> {
  const stored = paths.filter((p): p is string => !!p && isStoredImagePath(p) && parseGalleryPath(p) !== null);
  if (stored.length === 0) return;
  const supabase = await createSessionClient();
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove(stored);
  if (error) console.error("[painel] falha ao apagar fotos antigas", error.message);
}

export type ImageFieldResult =
  | { ok: true; value: StoredImage | null; replaced: string | null }
  | { ok: false; error: string };

/**
 * Foto de um formulário (campo escondido com o JSON montado pelo ImageAssetField).
 * Foto nova: confere o arquivo no bucket. Foto que já estava salva: só a descrição
 * e o ponto de foco podem mudar. `replaced`: arquivo antigo a apagar depois de salvar.
 */
export async function readImageField(
  formData: FormData,
  name: string,
  options: { folder: GalleryFolder; owner: string; current: { path: string } | null; required: boolean },
): Promise<ImageFieldResult> {
  const raw = String(formData.get(name) ?? "").trim();
  const replacedIfChanged = (path: string | null) =>
    options.current && options.current.path !== path ? options.current.path : null;
  if (!raw) {
    if (options.required) return { ok: false, error: "Envie uma foto." };
    return { ok: true, value: null, replaced: replacedIfChanged(null) };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Foto inválida. Envie de novo." };
  }
  const parsed = storedImageSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Foto inválida." };

  if (parsed.data.path !== options.current?.path) {
    const check = await verifyGalleryImage(parsed.data.path, { folder: options.folder, owner: options.owner });
    if (!check.ok) return { ok: false, error: check.message };
  }
  return { ok: true, value: parsed.data, replaced: replacedIfChanged(parsed.data.path) };
}
