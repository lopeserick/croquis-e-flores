import { z } from "zod";
import type { Tables } from "@/lib/supabase/database.types";
import { resolveImagePath } from "./image-url";
import type {
  ArtworkImageRow,
  ArtworkRow,
  CategoryModalityRow,
  CategoryRow,
  ImageAsset,
  ModalityRow,
  OptionRow,
} from "./types";

// Linhas do banco (snake_case) → tipos usados pelas telas.

/** Foto guardada em JSON (categorias, configurações). */
export const imageAssetSchema = z.object({
  path: z.string().min(1),
  alt: z.string().trim().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  focalX: z.number().min(0).max(100),
  focalY: z.number().min(0).max(100),
});

/** Troca o caminho guardado no banco pelo endereço que o navegador abre. */
export const withResolvedPath = <T extends { path: string }>(image: T): T => ({
  ...image,
  path: resolveImagePath(image.path),
});

/** Foto em JSON → ImageAsset pronto para exibir (com o endereço completo). */
export function parseImageAsset(value: unknown, where: string): ImageAsset {
  const result = imageAssetSchema.safeParse(value);
  if (!result.success) throw new Error(`Foto inválida em ${where}.`);
  return withResolvedPath(result.data);
}

export function toModality(row: Tables<"modalities">): ModalityRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image === null ? null : parseImageAsset(row.image, `modalidade "${row.slug}"`),
    deliveryKind: row.delivery_kind,
    sortOrder: row.sort_order,
    active: row.active,
  };
}

export function toCategory(row: Tables<"categories">): CategoryRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    image: row.image === null ? null : parseImageAsset(row.image, `categoria "${row.slug}"`),
    priceCents: row.price_cents,
    sortOrder: row.sort_order,
    active: row.active,
    showOnHome: row.show_on_home,
  };
}

export function toArtwork(row: Tables<"artworks">): ArtworkRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    story: row.story,
    dimensions: row.dimensions,
    categoryId: row.category_id,
    modalityId: row.modality_id,
    techniqueLabel: row.technique_label,
    featured: row.featured,
    sortOrder: row.sort_order,
    status: row.status,
  };
}

export function toOption(row: Tables<"options">): OptionRow {
  return {
    id: row.id,
    modalityId: row.modality_id,
    kind: row.kind,
    label: row.label,
    description: row.description,
    allowsCustom: row.allows_custom,
    priceCents: row.price_cents,
    requiresOptionIds: row.requires_option_ids,
    sortOrder: row.sort_order,
  };
}

export function toCategoryModality(row: Tables<"category_modalities">): CategoryModalityRow {
  return { categoryId: row.category_id, modalityId: row.modality_id };
}

export function toArtworkImage(row: Tables<"artwork_images">): ArtworkImageRow {
  return {
    id: row.id,
    artworkId: row.artwork_id,
    path: resolveImagePath(row.path),
    alt: row.alt,
    width: row.width,
    height: row.height,
    focalX: row.focal_x,
    focalY: row.focal_y,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  };
}
