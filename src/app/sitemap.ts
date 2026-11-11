import type { MetadataRoute } from "next";
import { getActiveCategories, getPublishedArtworks } from "@/features/catalog/queries";
import { getEnv } from "@/lib/env";

/** Lista de páginas para os buscadores (/sitemap.xml). Filtros da galeria ficam de fora. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getEnv("site").NEXT_PUBLIC_SITE_URL;
  const url = (path: string) => new URL(path, site).toString();
  const [categories, artworks] = await Promise.all([getActiveCategories(), getPublishedArtworks()]);

  return [
    { url: url("/"), priority: 1 },
    { url: url("/galeria"), priority: 0.9 },
    { url: url("/encomendar"), priority: 0.9 },
    { url: url("/tipos-de-obra"), priority: 0.7 },
    { url: url("/sobre"), priority: 0.6 },
    { url: url("/contato"), priority: 0.5 },
    ...categories.map((c) => ({ url: url(`/galeria/${c.slug}`), priority: 0.8 })),
    ...artworks.map((a) => ({ url: url(`/obra/${a.slug}`), priority: 0.7 })),
  ];
}
