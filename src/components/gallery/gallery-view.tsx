import Form from "next/form";
import { ArtworkGrid, EmptyState } from "@/components/site/artwork-grid";
import { ButtonLink } from "@/components/ui/button-link";
import { SearchIcon } from "@/components/ui/icons";
import {
  facetOptions,
  filterArtworks,
  galleryHref,
  hasActiveFilters,
  MAX_QUERY_LENGTH,
  modalityFacet,
  parseGalleryFilters,
  techniqueFacet,
  type GalleryFilters,
  type SearchParams,
} from "@/features/catalog/gallery-filters";
import { getActiveCategories, getPublishedArtworks } from "@/features/catalog/queries";
import { FilterChips, type Chip } from "./filter-chips";

type GalleryViewProps = {
  searchParams: Promise<SearchParams>;
  /** Coleção da página (/galeria/[categoria]); null na galeria completa. */
  categorySlug: string | null;
};

/** Busca, filtros e resultados. Lê o endereço, então roda a cada visita (dentro de um Suspense). */
export async function GalleryView({ searchParams, categorySlug }: GalleryViewProps) {
  const filters = parseGalleryFilters(await searchParams);
  const [artworks, categories] = await Promise.all([getPublishedArtworks(), getActiveCategories()]);

  // Opções dos filtros vêm das obras da coleção atual: nenhum filtro leva a uma lista vazia.
  const inScope = filterArtworks(artworks, { q: "", modalidade: null, tecnica: null }, categorySlug);
  const results = filterArtworks(artworks, filters, categorySlug);
  const href = (category: string | null, change: Partial<GalleryFilters>) =>
    galleryHref(category, { ...filters, ...change });

  // Ao trocar de coleção, a técnica escolhida sai: cada coleção tem as suas.
  const collectionChips: Chip[] = [
    { label: "Todas", href: href(null, { tecnica: null }), active: categorySlug === null },
    ...categories.map((c) => ({
      label: c.name,
      href: href(c.slug, { tecnica: null }),
      active: c.slug === categorySlug,
    })),
  ];
  const optionChips = (key: "modalidade" | "tecnica", options: { slug: string; label: string }[]): Chip[] => [
    { label: "Todas", href: href(categorySlug, { [key]: null }), active: !filters[key] },
    ...options.map((o) => ({
      label: o.label,
      href: href(categorySlug, { [key]: o.slug }),
      active: filters[key] === o.slug,
    })),
  ];
  const modalities = facetOptions(inScope, modalityFacet);
  const techniques = facetOptions(inScope, techniqueFacet);
  const clearHref = galleryHref(categorySlug, {});

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 rounded-card border border-border bg-white p-5 md:p-7">
        <Form action={categorySlug ? `/galeria/${categorySlug}` : "/galeria"} scroll={false} role="search">
          <label htmlFor="busca-galeria" className="mb-2.5 block text-xs uppercase tracking-eyebrow text-plum-muted">
            Buscar
          </label>
          <div className="flex gap-2.5">
            <div className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border-strong bg-cream px-4 text-plum-muted focus-within:border-plum">
              <SearchIcon size={18} />
              <input
                id="busca-galeria"
                name="q"
                type="search"
                defaultValue={filters.q}
                maxLength={MAX_QUERY_LENGTH}
                placeholder="Ex.: retrato, nanquim, casal"
                autoComplete="off"
                enterKeyHint="search"
                className="w-full min-w-0 bg-transparent text-[15px] text-plum placeholder:text-plum-muted focus:outline-none"
              />
            </div>
            {filters.modalidade && <input type="hidden" name="modalidade" value={filters.modalidade} />}
            {filters.tecnica && <input type="hidden" name="tecnica" value={filters.tecnica} />}
            <button
              type="submit"
              className="min-h-12 shrink-0 rounded-full bg-plum px-5 text-[13px] uppercase tracking-button text-cream hover:bg-rose"
            >
              Buscar
            </button>
          </div>
        </Form>
        <FilterChips id="filtro-colecao" label="Coleção" chips={collectionChips} />
        {modalities.length > 1 && (
          <FilterChips id="filtro-modalidade" label="Modalidade" chips={optionChips("modalidade", modalities)} />
        )}
        {techniques.length > 1 && (
          <FilterChips id="filtro-tecnica" label="Técnica" chips={optionChips("tecnica", techniques)} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-plum-muted">
          {results.length === 1 ? "1 obra encontrada" : `${results.length} obras encontradas`}
          {filters.q && (
            <>
              {" "}
              para <strong className="font-medium text-plum">“{filters.q}”</strong>
            </>
          )}
        </p>
        {hasActiveFilters(filters) && (
          <ButtonLink href={clearHref} scroll={false} variant="secondary" size="sm">
            Limpar filtros
          </ButtonLink>
        )}
      </div>

      <ArtworkGrid
        artworks={results}
        emptyState={
          inScope.length === 0 ? undefined : (
            <EmptyState
              title="Nenhuma obra encontrada."
              actions={
                <ButtonLink href={clearHref} scroll={false} variant="secondary">
                  Limpar filtros
                </ButtonLink>
              }
            >
              <p>
                Tente outra palavra ou menos filtros. Não achou o que procura? A artista cria uma obra exclusiva a
                partir da sua ideia.
              </p>
            </EmptyState>
          )
        }
      />
    </div>
  );
}

/** Esqueleto enquanto a galeria carrega. */
export function GallerySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <p className="sr-only" role="status">
        Carregando obras…
      </p>
      <div className="h-56 animate-pulse rounded-card bg-white motion-reduce:animate-none" />
      <ul className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex flex-col gap-3">
            <div className="aspect-[4/5] animate-pulse rounded-card bg-blush motion-reduce:animate-none" />
            <div className="h-3 w-1/2 rounded-full bg-blush" />
            <div className="h-6 w-4/5 rounded-full bg-blush" />
          </li>
        ))}
      </ul>
    </div>
  );
}
