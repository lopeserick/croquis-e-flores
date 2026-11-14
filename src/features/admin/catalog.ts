import "server-only";
import { resolveImagePath } from "@/features/catalog/image-url";
import type { DeliveryKind, OptionKind } from "@/features/catalog/types";
import type { Json } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";
import { storedImageSchema, type StoredImage } from "./gallery-images";

// Leituras do painel de catálogo: tudo, inclusive inativos, com a sessão da
// Carla (RLS). Sem cache.

export type AdminImage = StoredImage & { url: string };

/** Foto guardada em JSON → valor do ImageAssetField (null se não houver ou estiver inválida). */
export function toAdminImage(value: Json | null | undefined): AdminImage | null {
  const parsed = storedImageSchema.safeParse(value);
  return parsed.success ? { ...parsed.data, url: resolveImagePath(parsed.data.path) } : null;
}

export type AdminModality = {
  id: string;
  slug: string;
  name: string;
  description: string;
  deliveryKind: DeliveryKind;
  active: boolean;
  sortOrder: number;
  image: AdminImage | null;
};

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  priceCents: number | null;
  active: boolean;
  showOnHome: boolean;
  sortOrder: number;
  image: AdminImage | null;
  modalityIds: string[];
};

export type AdminOption = {
  id: string;
  modalityId: string;
  kind: OptionKind;
  label: string;
  description: string;
  priceCents: number | null;
  allowsCustom: boolean;
  active: boolean;
  sortOrder: number;
  requiresOptionIds: string[];
};

export type AdminCatalog = { modalities: AdminModality[]; categories: AdminCategory[]; options: AdminOption[] };

export async function getAdminCatalog(): Promise<AdminCatalog> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [modalities, categories, options, links] = await Promise.all([
    supabase.from("modalities").select("*").order("sort_order").order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("options").select("*").order("sort_order").order("label"),
    supabase.from("category_modalities").select("*"),
  ]);
  if (modalities.error || categories.error || options.error || links.error) {
    throw new Error("Falha ao carregar o catálogo.");
  }
  return {
    modalities: modalities.data.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      deliveryKind: m.delivery_kind,
      active: m.active,
      sortOrder: m.sort_order,
      image: toAdminImage(m.image),
    })),
    categories: categories.data.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      priceCents: c.price_cents,
      active: c.active,
      showOnHome: c.show_on_home,
      sortOrder: c.sort_order,
      image: toAdminImage(c.image),
      modalityIds: links.data.filter((l) => l.category_id === c.id).map((l) => l.modality_id),
    })),
    options: options.data.map((o) => ({
      id: o.id,
      modalityId: o.modality_id,
      kind: o.kind,
      label: o.label,
      description: o.description,
      priceCents: o.price_cents,
      allowsCustom: o.allows_custom,
      active: o.active,
      sortOrder: o.sort_order,
      requiresOptionIds: o.requires_option_ids,
    })),
  };
}
