// Tipo REAL de uma imagem, pelos primeiros bytes do arquivo (a "assinatura").
// A extensão e o tipo informado pelo navegador podem ser trocados por quem
// envia; os bytes, não. Usado no navegador (aviso imediato) e no servidor
// (barreira de verdade, entrega 6).

export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

/** Quantos bytes do início do arquivo bastam para identificar o tipo. */
export const SIGNATURE_BYTES = 12;

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

export function detectImageType(bytes: Uint8Array): ImageMime | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" .... "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}
