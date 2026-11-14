import "server-only";
import { resolveImagePath } from "@/features/catalog/image-url";
import type { ArtworkStatus } from "@/features/catalog/types";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";

// Leituras do painel de obras: todas as obras (inclusive rascunhos e
// arquivadas), com a sessão da Carla, sob o RLS. Sem cache.

export type AdminArtworkListItem = {
  id: string;
  slug: string;
  title: string;
  status: ArtworkStatus;
  featured: boolean;
  sortOrder: number;
  categoryName: string;
  modalityName: string;
  techniqueLabel: string;
  /** Endereço da capa para a miniatura (null = sem foto). */
  coverUrl: string | null;
  coverAlt: string;
  imageCount: number;
};

export async function listAdminArtworks(): Promise<AdminArtworkListItem[]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("artworks")
    .select(
      "id, slug, title, status, featured, sort_order, technique_label, categories(name), modalities(name), artwork_images(path, alt, is_cover)",
    )
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`Falha ao carregar as obras: ${error.message}`);

  return data.map((row) => {
    const cover = row.artwork_images.find((i) => i.is_cover) ?? row.artwork_images[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      featured: row.featured,
      sortOrder: row.sort_order,
      categoryName: row.categories?.name ?? "",
      modalityName: row.modalities?.name ?? "",
      techniqueLabel: row.technique_label,
      coverUrl: cover ? resolveImagePath(cover.path) : null,
      coverAlt: cover?.alt ?? "",
      imageCount: row.artwork_images.length,
    };
  });
}

export type AdminArtworkImage = {
  id: string;
  /** Caminho guardado no banco. */
  path: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  sortOrder: number;
  isCover: boolean;
};

export type AdminArtwork = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  story: string;
  categoryId: string;
  modalityId: string;
  techniqueLabel: string;
  dimensions: string;
  featured: boolean;
  status: ArtworkStatus;
  publishedAt: string | null;
  images: AdminArtworkImage[];
};

export async function getAdminArtwork(id: string): Promise<AdminArtwork | null> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("artworks").select("*, artwork_images(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao carregar a obra: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    shortDescription: data.short_description,
    story: data.story,
    categoryId: data.category_id,
    modalityId: data.modality_id,
    techniqueLabel: data.technique_label,
    dimensions: data.dimensions,
    featured: data.featured,
    status: data.status,
    publishedAt: data.published_at,
    images: data.artwork_images
      .map((i) => ({
        id: i.id,
        path: i.path,
        url: resolveImagePath(i.path),
        alt: i.alt,
        width: i.width,
        height: i.height,
        focalX: i.focal_x,
        focalY: i.focal_y,
        sortOrder: i.sort_order,
        isCover: i.is_cover,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export type ArtworkFormOptions = {
  categories: { id: string; name: string; active: boolean }[];
  modalities: { id: string; name: string; active: boolean }[];
  /** Técnicas cadastradas por modalidade, como sugestão no campo "Técnica". */
  techniques: { modalityId: string; label: string }[];
};

export async function getArtworkFormOptions(): Promise<ArtworkFormOptions> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [categories, modalities, techniques] = await Promise.all([
    supabase.from("categories").select("id, name, active").order("sort_order"),
    supabase.from("modalities").select("id, name, active").order("sort_order"),
    supabase.from("options").select("modality_id, label").eq("kind", "technique").order("sort_order"),
  ]);
  if (categories.error || modalities.error || techniques.error) throw new Error("Falha ao carregar o catálogo.");
  return {
    categories: categories.data,
    modalities: modalities.data,
    techniques: techniques.data.map((t) => ({ modalityId: t.modality_id, label: t.label })),
  };
}
