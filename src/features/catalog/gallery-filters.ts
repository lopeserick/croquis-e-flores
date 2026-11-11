import { normalizeText, slugify } from "@/lib/text";
import type { ArtworkSummary } from "./types";

// Filtros da galeria. Ficam no endereço (?q=&modalidade=&tecnica=), assim o
// link filtrado pode ser compartilhado no WhatsApp e no Instagram.

export type GalleryFilters = {
  q: string;
  modalidade: string | null;
  tecnica: string | null;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const MAX_QUERY_LENGTH = 80;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const slugParam = (value: string | string[] | undefined) => {
  const v = first(value)?.trim().toLowerCase();
  return v && SLUG.test(v) ? v : null;
};

/** Lê os filtros do endereço, ignorando valores inválidos. */
export function parseGalleryFilters(params: SearchParams): GalleryFilters {
  return {
    q: (first(params.q) ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH),
    modalidade: slugParam(params.modalidade),
    tecnica: slugParam(params.tecnica),
  };
}

export const hasActiveFilters = (filters: GalleryFilters) =>
  Boolean(filters.q || filters.modalidade || filters.tecnica);

export const techniqueSlug = (artwork: Pick<ArtworkSummary, "techniqueLabel">) =>
  slugify(artwork.techniqueLabel);

/** Toda palavra buscada precisa aparecer em algum texto da obra (sem diferenciar acentos). */
export function matchesQuery(artwork: ArtworkSummary, query: string): boolean {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeText(
    [
      artwork.title,
      artwork.shortDescription,
      artwork.category.name,
      artwork.modality.name,
      artwork.techniqueLabel,
    ].join(" "),
  );
  return terms.every((term) => haystack.includes(term));
}

export function filterArtworks(
  artworks: ArtworkSummary[],
  filters: GalleryFilters,
  categorySlug: string | null = null,
): ArtworkSummary[] {
  return artworks.filter(
    (a) =>
      (!categorySlug || a.category.slug === categorySlug) &&
      (!filters.modalidade || a.modality.slug === filters.modalidade) &&
      (!filters.tecnica || techniqueSlug(a) === filters.tecnica) &&
      matchesQuery(a, filters.q),
  );
}

export type FacetOption = { slug: string; label: string };

/**
 * Opções de um filtro, tiradas das obras que existem (nunca um filtro que
 * leva a uma lista vazia). Mantém a ordem em que aparecem.
 */
export function facetOptions(
  artworks: ArtworkSummary[],
  pick: (artwork: ArtworkSummary) => FacetOption,
): FacetOption[] {
  const seen = new Map<string, FacetOption>();
  for (const artwork of artworks) {
    const option = pick(artwork);
    if (option.slug && !seen.has(option.slug)) seen.set(option.slug, option);
  }
  return [...seen.values()];
}

export const modalityFacet = (a: ArtworkSummary): FacetOption => ({
  slug: a.modality.slug,
  label: a.modality.name,
});

export const techniqueFacet = (a: ArtworkSummary): FacetOption => ({
  slug: techniqueSlug(a),
  label: a.techniqueLabel,
});

/** Endereço da galeria com a coleção e os filtros dados (vazios ficam de fora). */
export function galleryHref(categorySlug: string | null, filters: Partial<GalleryFilters>): string {
  const path = categorySlug ? `/galeria/${categorySlug}` : "/galeria";
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.modalidade) params.set("modalidade", filters.modalidade);
  if (filters.tecnica) params.set("tecnica", filters.tecnica);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
