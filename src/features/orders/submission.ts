import { z } from "zod";
import type { ImageMime } from "@/lib/security/file-signature";

// Formato das mensagens entre o configurador (navegador) e as Server Actions
// do envio. Valem dos dois lados; o servidor nunca confia no que chega.

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Chave do pedido (UUID v4), gerada no navegador uma vez por rascunho: repetir
 * o envio devolve o mesmo pedido. Usa getRandomValues porque crypto.randomUUID
 * só existe em HTTPS, e o teste no celular abre o site por http://IP:3000.
 */
export function newIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const idempotencyKeySchema = z.string().regex(UUID_V4);

export const IMAGE_EXTENSIONS: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const imageMimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

/** Caminho no bucket privado: <chave do pedido>/<ordem>-<aleatório>.<ext>. */
export function referencePath(key: string, index: number, mime: ImageMime, random: string): string {
  return `${key}/${index}-${random}.${IMAGE_EXTENSIONS[mime]}`;
}

/** O caminho foi gerado pelo servidor para esta chave? (impede apontar para foto de outro pedido) */
export function isReferencePathFor(key: string, path: string): boolean {
  const escaped = key.replace(/-/g, "\\-");
  return new RegExp(`^${escaped}/\\d{1,2}-[a-z0-9]{8,32}\\.(jpg|png|webp)$`).test(path);
}

/** Pedido de links de envio: só os metadados; o arquivo vai direto do navegador ao armazenamento. */
export const prepareUploadsSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  files: z
    .array(z.object({ name: z.string().min(1).max(200), size: z.int().positive(), type: imageMimeSchema }))
    .min(1)
    .max(20),
});

export type PrepareUploadsInput = z.infer<typeof prepareUploadsSchema>;
export type PrepareUploadsResult =
  | { ok: true; uploads: { path: string; url: string }[] }
  | { ok: false; message: string };

export const submitOrderSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  /** Validado à parte com as regras do pedido (schema.ts). */
  draft: z.unknown(),
  references: z.array(z.object({ path: z.string().max(200), name: z.string().min(1).max(200) })).max(20),
  /** Campo-armadilha: invisível para pessoas, robôs costumam preencher. */
  website: z.string().max(200),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
export type SubmitOrderResult =
  | { ok: true; number: string; whatsappUrl: string | null }
  | { ok: false; message: string; step?: number };
