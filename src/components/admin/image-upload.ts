import { fitWithin, galleryMimeSchema } from "@/features/admin/gallery-images";
import { detectImageType, SIGNATURE_BYTES, type ImageMime } from "@/lib/security/file-signature";

// Preparo das fotos no navegador do painel, antes de enviar:
// reduz para no máximo 2400 px e converte para WebP. Isso também descarta os
// dados da câmera (EXIF, que podem ter a localização de onde a foto foi tirada).

export type PreparedImage = { blob: Blob; mime: ImageMime; width: number; height: number };

export class ImagePrepError extends Error {}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const head = new Uint8Array(await file.slice(0, SIGNATURE_BYTES).arrayBuffer());
  if (!detectImageType(head)) throw new ImagePrepError(`"${file.name}" não é uma foto JPG, PNG ou WebP.`);

  let bitmap: ImageBitmap;
  try {
    // Já aplica a orientação da câmera (foto "deitada" do celular fica em pé).
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImagePrepError(`Não foi possível abrir "${file.name}". Tente outra foto.`);
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImagePrepError("Este navegador não conseguiu preparar a foto.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  // Navegadores antigos sem WebP devolvem PNG: também é aceito.
  const mime = galleryMimeSchema.safeParse(blob?.type);
  if (!blob || !mime.success) throw new ImagePrepError("Este navegador não conseguiu preparar a foto.");
  return { blob, mime: mime.data, width, height };
}

/** Envia para o link assinado gerado pelo servidor (sem chave do Supabase no navegador). */
export async function putToSignedUrl(url: string, image: PreparedImage): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": image.mime, "x-upsert": "false" },
      body: image.blob,
    });
    return response.ok;
  } catch {
    return false;
  }
}
