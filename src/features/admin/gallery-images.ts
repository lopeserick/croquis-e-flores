import { z } from "zod";
import { GALLERY_FOLDERS, type GalleryFolder } from "@/features/catalog/image-url";
import type { ImageMime } from "@/lib/security/file-signature";

// Fotos que a Carla envia pelo painel (obras, coleções, modalidades, textos do
// site). Vão para o bucket PÚBLICO "obras": nunca usar para fotos de clientes.
//
// O navegador reduz a foto (até 2400 px no lado maior) e a converte para WebP
// antes de enviar: menos espaço no armazenamento e sem dados de localização da
// câmera (EXIF). O servidor confere o tipo real pelos primeiros bytes.

export const MAX_GALLERY_IMAGE_MB = 15;
export const MAX_IMAGE_SIDE = 2400;
export const GALLERY_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const EXTENSIONS: Record<ImageMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const galleryMimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

/** Dono da foto: id da obra/coleção/modalidade, ou a seção do site ("inicio", "sobre"). */
const ownerPattern = /^[a-z0-9-]{2,64}$/;

export const galleryUploadSchema = z.object({
  folder: z.enum(GALLERY_FOLDERS),
  owner: z.string().regex(ownerPattern),
  mime: galleryMimeSchema,
  size: z.int().positive().max(MAX_GALLERY_IMAGE_MB * 1024 * 1024),
});

/** "obras/<id-da-obra>/a1b2c3d4e5f60708.webp" */
export function galleryPath(folder: GalleryFolder, owner: string, mime: ImageMime, random: string): string {
  return `${folder}/${owner}/${random}.${EXTENSIONS[mime]}`;
}

/** Caminho que o servidor gerou para este dono (sem "..", sem outra pasta). */
export function isGalleryPathFor(folder: GalleryFolder, owner: string, path: string): boolean {
  return new RegExp(`^${folder}/${owner}/[a-f0-9]{16}\\.(jpg|png|webp)$`).test(path);
}

/** Pasta e dono de um caminho do bucket, ou null se não for um caminho do painel. */
export function parseGalleryPath(path: string): { folder: GalleryFolder; owner: string } | null {
  const match = /^([a-z]+)\/([a-z0-9-]{2,64})\/[a-f0-9]{16}\.(jpg|png|webp)$/.exec(path);
  if (!match || !(GALLERY_FOLDERS as readonly string[]).includes(match[1])) return null;
  return { folder: match[1] as GalleryFolder, owner: match[2] };
}

/** Texto alternativo: descreve a foto para quem usa leitor de tela (e para o Google). */
export const altSchema = z
  .string()
  .trim()
  .min(3, "Descreva a foto em poucas palavras (texto alternativo).")
  .max(200, "Use até 200 caracteres.");

const percent = z.coerce.number().int().min(0).max(100);

/** Foto já enviada, com descrição e ponto de foco, como fica guardada no banco. */
export const storedImageSchema = z.object({
  path: z.string().min(1),
  alt: altSchema,
  width: z.int().positive().max(20000),
  height: z.int().positive().max(20000),
  focalX: percent,
  focalY: percent,
});
export type StoredImage = z.infer<typeof storedImageSchema>;

/** Novo tamanho para caber em `max` px no lado maior, sem aumentar fotos pequenas. */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
