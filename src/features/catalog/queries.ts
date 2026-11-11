import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { createPublicClient, rowsOrThrow } from "@/lib/supabase/server";
import {
  toArtwork,
  toArtworkImage,
  toCategory,
  toCategoryModality,
  toModality,
  toOption,
} from "./mappers";
import type {
  ArtworkDetail,
  ArtworkImageRow,
  ArtworkRow,
  ArtworkSummary,
  CategoryModalityRow,
  CategoryRow,
  ImageAsset,
  ModalityRow,
  OptionRow,
} from "./types";

// Consultas do catálogo, lidas do Supabase com a chave pública (o RLS só
// entrega o que está ativo e publicado).

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

type SummarySources = {
  categories: CategoryRow[];
  modalities: ModalityRow[];
  images: ArtworkImageRow[];
};

const asImage = ({ path, alt, width, height, focalX, focalY }: ImageAsset): ImageAsset => ({
  path,
  alt,
  width,
  height,
  focalX,
  focalY,
});

/**
 * Junta obra, categoria, modalidade e capa. Obras sem categoria, modalidade
 * ou foto de capa ficam de fora: um card incompleto não deve ir para a vitrine.
 */
export function buildArtworkSummaries(
  rows: ArtworkRow[],
  sources: SummarySources,
): ArtworkSummary[] {
  return rows.flatMap((artwork) => {
    const category = sources.categories.find((c) => c.id === artwork.categoryId);
    const modality = sources.modalities.find((m) => m.id === artwork.modalityId);
    const cover = sources.images.find((img) => img.artworkId === artwork.id && img.isCover);
    if (!category || !modality || !cover) return [];
    return [
      {
        id: artwork.id,
        slug: artwork.slug,
        title: artwork.title,
        shortDescription: artwork.shortDescription,
        category: { id: category.id, slug: category.slug, name: category.name },
        modality: {
          id: modality.id,
          slug: modality.slug,
          name: modality.name,
          deliveryKind: modality.deliveryKind,
        },
        techniqueLabel: artwork.techniqueLabel,
        cover: asImage(cover),
      },
    ];
  });
}

export type Catalog = SummarySources & {
  artworks: ArtworkRow[];
  options: OptionRow[];
  categoryModalities: CategoryModalityRow[];
};

/**
 * O catálogo inteiro numa leitura só: é pequeno e quase todas as páginas usam
 * uma parte dele. Fica em cache até o painel salvar algo (etiqueta "catalog")
 * ou, no máximo, por uma hora.
 */
export async function loadCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.catalog);

  const db = createPublicClient();
  const [modalities, categories, artworks, images, options, categoryModalities] = await Promise.all([
    db.from("modalities").select("*").eq("active", true).order("sort_order"),
    db.from("categories").select("*").eq("active", true).order("sort_order"),
    db.from("artworks").select("*").eq("status", "publicada").order("sort_order"),
    db.from("artwork_images").select("*").order("sort_order"),
    db.from("options").select("*").eq("active", true).order("sort_order"),
    db.from("category_modalities").select("*"),
  ]);

  return {
    modalities: rowsOrThrow(modalities, "modalidades").map(toModality),
    categories: rowsOrThrow(categories, "categorias").map(toCategory),
    artworks: rowsOrThrow(artworks, "obras").map(toArtwork),
    images: rowsOrThrow(images, "fotos das obras").map(toArtworkImage),
    options: rowsOrThrow(options, "opções de encomenda").map(toOption),
    categoryModalities: rowsOrThrow(categoryModalities, "tipos de arte").map(toCategoryModality),
  };
}

async function publishedSummaries(filter: (artwork: ArtworkRow) => boolean = () => true) {
  const catalog = await loadCatalog();
  const rows = catalog.artworks
    .filter((a) => a.status === "publicada" && filter(a))
    .sort(bySortOrder);
  return buildArtworkSummaries(rows, catalog);
}

export async function getHomeCategories(): Promise<CategoryRow[]> {
  const { categories } = await loadCatalog();
  return categories.filter((c) => c.active && c.showOnHome).sort(bySortOrder);
}

export async function getActiveCategories(): Promise<CategoryRow[]> {
  const { categories } = await loadCatalog();
  return categories.filter((c) => c.active).sort(bySortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { categories } = await loadCatalog();
  return categories.find((c) => c.active && c.slug === slug) ?? null;
}

export async function getActiveModalities(): Promise<ModalityRow[]> {
  const { modalities } = await loadCatalog();
  return modalities.filter((m) => m.active).sort(bySortOrder);
}

export async function getFeaturedArtworks(): Promise<ArtworkSummary[]> {
  return publishedSummaries((a) => a.featured);
}

export async function getPublishedArtworks(): Promise<ArtworkSummary[]> {
  return publishedSummaries();
}

export async function getArtworkBySlug(slug: string): Promise<ArtworkSummary | null> {
  return (await publishedSummaries((a) => a.slug === slug))[0] ?? null;
}

/** Obra completa para a página de detalhes. */
export async function getArtworkDetail(slug: string): Promise<ArtworkDetail | null> {
  const catalog = await loadCatalog();
  const row = catalog.artworks.find((a) => a.slug === slug && a.status === "publicada");
  const summary = row ? buildArtworkSummaries([row], catalog)[0] : undefined;
  if (!row || !summary) return null;

  const images = catalog.images
    .filter((img) => img.artworkId === row.id)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder)
    .map(asImage);

  return { ...summary, story: row.story, dimensions: row.dimensions, images };
}

/** Outras obras para "Mais obras": primeiro da mesma coleção, depois as demais. */
export function pickRelatedArtworks(
  artwork: Pick<ArtworkSummary, "id" | "category">,
  all: ArtworkSummary[],
  limit = 4,
): ArtworkSummary[] {
  const others = all.filter((a) => a.id !== artwork.id);
  const sameCategory = others.filter((a) => a.category.slug === artwork.category.slug);
  const rest = others.filter((a) => a.category.slug !== artwork.category.slug);
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Opções de encomenda das modalidades ativas (preços em "Tipos de obra"). */
export async function getActiveOptions(): Promise<OptionRow[]> {
  const { options, modalities } = await loadCatalog();
  const active = new Set(modalities.filter((m) => m.active).map((m) => m.id));
  return options.filter((o) => active.has(o.modalityId)).sort(bySortOrder);
}
