import { cacheLife, cacheTag } from "next/cache";
import { buildArtworkSummaries, loadCatalog } from "@/features/catalog/queries";
import { cacheTags } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";
import { orderFormSettingsSchema, type OrderFormData, type OrderFormSettings } from "./form-types";

export async function getOrderFormSettings(): Promise<OrderFormSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.settings);

  const { data, error } = await createPublicClient()
    .from("settings")
    .select("value")
    .eq("key", "order_form")
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar as configurações do formulário: ${error.message}`);
  const parsed = orderFormSettingsSchema.safeParse(data?.value);
  if (!parsed.success) throw new Error("Configuração order_form ausente ou inválida no banco.");
  return parsed.data;
}

/** Tudo que o configurador precisa, num formato enxuto para o navegador. */
export async function getOrderFormData(): Promise<OrderFormData> {
  const [catalog, settings] = await Promise.all([loadCatalog(), getOrderFormSettings()]);
  const activeModalityIds = new Set(catalog.modalities.map((m) => m.id));

  const artworks = buildArtworkSummaries(
    catalog.artworks.filter((a) => a.status === "publicada"),
    catalog,
  ).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    categoryId: a.category.id,
    modalityId: a.modality.id,
    cover: a.cover,
  }));

  return {
    modalities: catalog.modalities.map(({ id, slug, name, description, deliveryKind, image }) => ({
      id,
      slug,
      name,
      description,
      deliveryKind,
      image,
    })),
    categories: catalog.categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      image: c.image,
      priceCents: c.priceCents,
      modalityIds: catalog.categoryModalities
        .filter((link) => link.categoryId === c.id && activeModalityIds.has(link.modalityId))
        .map((link) => link.modalityId),
    })),
    options: catalog.options.filter((o) => activeModalityIds.has(o.modalityId)),
    artworks,
    settings,
  };
}
