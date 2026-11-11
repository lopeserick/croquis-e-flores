import { detectImageType, type ImageMime } from "@/lib/security/file-signature";
import type { OrderFormSettings } from "./form-types";

// Fotos de referência: só JPG, PNG e WebP (o iPhone converte HEIC para JPEG
// quando o campo não aceita HEIC). Extensão E conteúdo são conferidos.

export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export type ReferenceCheck = { ok: true; mime: ImageMime } | { ok: false; reason: string };

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/** Tamanho legível: "350 KB" abaixo de 1 MB, senão "2,4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return formatMegabytes(bytes);
}

/**
 * @param head primeiros bytes do arquivo (ver SIGNATURE_BYTES)
 */
export function checkReference(
  file: { name: string; size: number },
  head: Uint8Array,
  settings: Pick<OrderFormSettings, "maxFileSizeMb">,
): ReferenceCheck {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { ok: false, reason: `"${file.name}" não é JPG, PNG ou WebP.` };
  }
  if (file.size === 0) return { ok: false, reason: `"${file.name}" está vazio.` };
  if (file.size > settings.maxFileSizeMb * 1024 * 1024) {
    return {
      ok: false,
      reason: `"${file.name}" tem ${formatMegabytes(file.size)}; o limite é ${settings.maxFileSizeMb} MB por foto.`,
    };
  }
  const mime = detectImageType(head);
  if (!mime) return { ok: false, reason: `"${file.name}" não é uma imagem válida (JPG, PNG ou WebP).` };
  return { ok: true, mime };
}
