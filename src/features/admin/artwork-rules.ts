import { z } from "zod";
import type { ArtworkStatus } from "@/features/catalog/types";
import { slugify } from "@/lib/text";

// Regras do cadastro de obras (painel, entrega 8). Valem no navegador e no
// servidor; o banco repete as mais importantes (RLS, uma capa por obra).

export const ARTWORK_STATUSES: readonly ArtworkStatus[] = ["publicada", "rascunho", "arquivada"];

export const ARTWORK_STATUS_LABELS: Record<ArtworkStatus, string> = {
  publicada: "Publicada",
  rascunho: "Rascunho",
  arquivada: "Arquivada",
};

export const isArtworkStatus = (value: unknown): value is ArtworkStatus =>
  typeof value === "string" && (ARTWORK_STATUSES as readonly string[]).includes(value);

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const artworkFormSchema = z.object({
  title: z.string().trim().min(2, "Escreva o nome da obra.").max(120, "Use até 120 caracteres."),
  /** Vazio: gerado a partir do nome. */
  slug: z
    .string()
    .trim()
    .max(80, "Use até 80 caracteres.")
    .refine((s) => s === "" || slugPattern.test(s), "Use só letras minúsculas sem acento, números e hífens."),
  categoryId: z.uuid("Escolha a coleção."),
  modalityId: z.uuid("Escolha a modalidade."),
  techniqueLabel: z.string().trim().min(2, "Escreva a técnica (ex.: Nanquim).").max(60, "Use até 60 caracteres."),
  dimensions: z.string().trim().max(60, "Use até 60 caracteres."),
  shortDescription: z.string().trim().max(300, "Use até 300 caracteres."),
  story: z.string().trim().max(4000, "Use até 4.000 caracteres."),
  featured: z.boolean(),
});
export type ArtworkForm = z.infer<typeof artworkFormSchema>;

/** Endereço da obra (/obra/...) a partir do que foi digitado ou do nome. */
export const artworkSlug = (form: Pick<ArtworkForm, "slug" | "title">) => form.slug || slugify(form.title).slice(0, 80);

/** Texto entre colchetes = pendência ("[Nome da obra]"), não pode ir para o site. */
export const hasPlaceholder = (text: string) => /\[[^\]]*\]/.test(text);

/**
 * O que impede a obra de ir para a galeria. Lista vazia = pode publicar.
 * Sem foto de capa a obra nem apareceria (o card precisa da capa).
 */
export function publishProblems(
  artwork: { title: string; shortDescription: string },
  images: { alt: string; isCover: boolean }[],
): string[] {
  const problems: string[] = [];
  if (images.length === 0) problems.push("Envie pelo menos uma foto da obra.");
  else if (!images.some((i) => i.isCover)) problems.push("Escolha a foto de capa.");
  if (images.some((i) => i.alt.trim().length < 3)) problems.push("Descreva todas as fotos (texto alternativo).");
  if (hasPlaceholder(artwork.title)) problems.push("Troque o nome provisório (entre colchetes) pelo nome da obra.");
  if (hasPlaceholder(artwork.shortDescription)) problems.push("Troque a descrição provisória (entre colchetes).");
  return problems;
}

/** Ao apagar a capa, a próxima foto (na ordem) vira capa. */
export function nextCoverAfterRemoval<T extends { id: string; isCover: boolean; sortOrder: number }>(
  images: T[],
  removedId: string,
): string | null {
  const removed = images.find((i) => i.id === removedId);
  if (!removed?.isCover) return null;
  const rest = images.filter((i) => i.id !== removedId).sort((a, b) => a.sortOrder - b.sortOrder);
  return rest[0]?.id ?? null;
}

/** Obra publicada não pode ficar sem foto: some da galeria sem aviso. */
export const canRemoveImage = (status: ArtworkStatus, imageCount: number) => status !== "publicada" || imageCount > 1;
