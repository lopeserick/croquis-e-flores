"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cacheTags } from "@/lib/cache-tags";
import { createSessionClient } from "@/lib/supabase/session";
import {
  artworkFormSchema,
  artworkSlug,
  canRemoveImage,
  isArtworkStatus,
  nextCoverAfterRemoval,
  publishProblems,
} from "./artwork-rules";
import { requireAdmin } from "./auth";
import { formBool, formText, invalid, moveInList, NOT_FOUND, SAVE_FAILED, type FormState } from "./forms";
import { altSchema, galleryMimeSchema, storedImageSchema } from "./gallery-images";
import { createGalleryUpload, removeGalleryFiles, verifyGalleryImage, type GalleryUploadResult } from "./gallery-upload";
import { siteContentChanged } from "./site-cache";
import { saveOrder } from "./sort-order";

// Ações do painel de obras. Cada uma confere o admin de novo (uma Server
// Action pode ser chamada direto) e grava com a sessão dele, sob o RLS.
// Depois de gravar, siteContentChanged atualiza a galeria na hora.

const idSchema = z.uuid();

const published = () => siteContentChanged(cacheTags.catalog);

async function loadArtwork(id: unknown) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("artworks")
    .select("id, title, short_description, status, published_at, artwork_images(id, path, alt, is_cover, sort_order)")
    .eq("id", parsed.data)
    .maybeSingle();
  return data ? { supabase, artwork: data } : null;
}

// ---------------------------------------------------------------------------
// Dados da obra
// ---------------------------------------------------------------------------

export async function saveArtwork(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = artworkFormSchema.safeParse({
    title: formText(formData, "title"),
    slug: formText(formData, "slug"),
    categoryId: formText(formData, "categoryId"),
    modalityId: formText(formData, "modalityId"),
    techniqueLabel: formText(formData, "techniqueLabel"),
    dimensions: formText(formData, "dimensions"),
    shortDescription: formText(formData, "shortDescription"),
    story: formText(formData, "story"),
    featured: formBool(formData, "featured"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const form = parsed.data;
  const id = formText(formData, "id");
  if (id && !idSchema.safeParse(id).success) return NOT_FOUND;

  const supabase = await createSessionClient();
  const slug = artworkSlug(form);
  if (!slug) return { ok: false, message: "Confira os campos destacados.", errors: { slug: "Escreva o endereço da obra." } };
  const { data: sameSlug } = await supabase.from("artworks").select("id").eq("slug", slug);
  if (sameSlug?.some((a) => a.id !== id)) {
    return {
      ok: false,
      message: "Confira os campos destacados.",
      errors: { slug: `Já existe uma obra com o endereço "${slug}". Escolha outro.` },
    };
  }

  // Técnica cadastrada com o mesmo nome nesta modalidade (filtros da galeria).
  const { data: technique } = await supabase
    .from("options")
    .select("id")
    .eq("modality_id", form.modalityId)
    .eq("kind", "technique")
    .ilike("label", form.techniqueLabel)
    .limit(1)
    .maybeSingle();

  const values = {
    slug,
    title: form.title,
    short_description: form.shortDescription,
    story: form.story,
    category_id: form.categoryId,
    modality_id: form.modalityId,
    technique_label: form.techniqueLabel,
    technique_option_id: technique?.id ?? null,
    dimensions: form.dimensions,
    featured: form.featured,
  };

  if (!id) {
    // Nova obra: começa como rascunho, no fim da lista.
    const { data: last } = await supabase
      .from("artworks")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: created, error } = await supabase
      .from("artworks")
      .insert({ ...values, status: "rascunho", sort_order: (last?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error || !created) return SAVE_FAILED;
    published();
    redirect(`/admin/obras/${created.id}?criada=1`);
  }

  const { error } = await supabase.from("artworks").update(values).eq("id", id);
  if (error) return SAVE_FAILED;
  published();
  return { ok: true, message: "Obra salva." };
}

export async function setArtworkStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const status = formData.get("status");
  if (!isArtworkStatus(status)) return { ok: false, message: "Status inválido." };
  const loaded = await loadArtwork(formData.get("id"));
  if (!loaded) return NOT_FOUND;
  const { supabase, artwork } = loaded;

  if (status === "publicada") {
    const problems = publishProblems(
      { title: artwork.title, shortDescription: artwork.short_description },
      artwork.artwork_images.map((i) => ({ alt: i.alt, isCover: i.is_cover })),
    );
    if (problems.length > 0) return { ok: false, message: `Ainda não dá para publicar. ${problems.join(" ")}` };
  }

  const { error } = await supabase
    .from("artworks")
    .update({
      status,
      published_at: status === "publicada" ? (artwork.published_at ?? new Date().toISOString()) : artwork.published_at,
    })
    .eq("id", artwork.id);
  if (error) return SAVE_FAILED;
  published();
  const messages = {
    publicada: "Obra publicada: já aparece na galeria.",
    rascunho: "Obra voltou para rascunho: não aparece mais no site.",
    arquivada: "Obra arquivada: não aparece mais no site.",
  };
  return { ok: true, message: messages[status] };
}

export async function deleteArtwork(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const loaded = await loadArtwork(formData.get("id"));
  if (!loaded) return NOT_FOUND;
  const { supabase, artwork } = loaded;
  if (formText(formData, "confirm") !== "apagar") {
    return { ok: false, message: 'Para apagar de vez, digite "apagar" no campo.' };
  }
  const { error } = await supabase.from("artworks").delete().eq("id", artwork.id);
  if (error) return SAVE_FAILED;
  await removeGalleryFiles(artwork.artwork_images.map((i) => i.path));
  published();
  redirect("/admin/obras?apagada=1");
}

/** Sobe ou desce a obra na ordem da galeria (a mesma ordem da lista do painel). */
export async function moveArtwork(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formText(formData, "id");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  const supabase = await createSessionClient();
  const { data } = await supabase.from("artworks").select("id, sort_order").order("sort_order").order("created_at");
  if (!data) return;
  const moved = moveInList(data, data.findIndex((a) => a.id === id), direction);
  if (!moved) return;
  // Renumera 1, 2, 3…: corrige empates antigos.
  await saveOrder("artworks", moved);
  published();
}

// ---------------------------------------------------------------------------
// Fotos da obra
// ---------------------------------------------------------------------------

/** 1º passo do envio: link assinado para o navegador mandar a foto (já reduzida). */
export async function prepareArtworkImage(input: { artworkId: string; mime: string; size: number }): Promise<GalleryUploadResult> {
  await requireAdmin();
  const loaded = await loadArtwork(input.artworkId);
  if (!loaded) return { ok: false, message: "Obra não encontrada. Recarregue a página." };
  return createGalleryUpload({ folder: "obras", owner: loaded.artwork.id, mime: input.mime, size: input.size });
}

const newImageSchema = z.object({
  artworkId: z.uuid(),
  path: z.string(),
  width: z.int().positive().max(20000),
  height: z.int().positive().max(20000),
  alt: altSchema,
  mime: galleryMimeSchema,
});

/** 2º passo: confere o arquivo enviado e registra a foto na obra. */
export async function addArtworkImage(input: unknown): Promise<FormState> {
  await requireAdmin();
  const parsed = newImageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error, "Foto inválida.");
  const loaded = await loadArtwork(parsed.data.artworkId);
  if (!loaded) return NOT_FOUND;
  const { supabase, artwork } = loaded;

  const check = await verifyGalleryImage(parsed.data.path, { folder: "obras", owner: artwork.id });
  if (!check.ok) return { ok: false, message: check.message };

  const images = artwork.artwork_images;
  const { error } = await supabase.from("artwork_images").insert({
    artwork_id: artwork.id,
    path: parsed.data.path,
    alt: parsed.data.alt,
    width: parsed.data.width,
    height: parsed.data.height,
    sort_order: Math.max(0, ...images.map((i) => i.sort_order)) + 1,
    is_cover: !images.some((i) => i.is_cover),
  });
  if (error) {
    await removeGalleryFiles([parsed.data.path]);
    return SAVE_FAILED;
  }
  published();
  return { ok: true, message: "Foto adicionada." };
}

async function loadImage(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("imageId"));
  if (!parsed.success) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("artwork_images")
    .select("id, artwork_id, path, is_cover, sort_order")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!data) return null;
  const loaded = await loadArtwork(data.artwork_id);
  return loaded ? { ...loaded, image: data } : null;
}

/** Descrição e ponto de foco (o centro dos cortes nos cards). */
export async function updateArtworkImage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const loaded = await loadImage(formData);
  if (!loaded) return NOT_FOUND;
  const parsed = storedImageSchema.pick({ alt: true, focalX: true, focalY: true }).safeParse({
    alt: formText(formData, "alt"),
    focalX: formText(formData, "focalX"),
    focalY: formText(formData, "focalY"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await loaded.supabase
    .from("artwork_images")
    .update({ alt: parsed.data.alt, focal_x: parsed.data.focalX, focal_y: parsed.data.focalY })
    .eq("id", loaded.image.id);
  if (error) return SAVE_FAILED;
  published();
  return { ok: true, message: "Foto salva." };
}

export async function setArtworkCover(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const loaded = await loadImage(formData);
  if (!loaded) return NOT_FOUND;
  const { supabase, image } = loaded;
  if (image.is_cover) return { ok: true, message: "Esta já é a capa." };
  // Uma capa por obra (índice único no banco): tira a antiga antes.
  const cleared = await supabase
    .from("artwork_images")
    .update({ is_cover: false })
    .eq("artwork_id", image.artwork_id)
    .eq("is_cover", true);
  const set = cleared.error ? cleared : await supabase.from("artwork_images").update({ is_cover: true }).eq("id", image.id);
  if (set.error) return SAVE_FAILED;
  published();
  return { ok: true, message: "Capa trocada." };
}

export async function moveArtworkImage(formData: FormData): Promise<void> {
  await requireAdmin();
  const loaded = await loadImage(formData);
  if (!loaded) return;
  const { artwork, image } = loaded;
  const images = [...artwork.artwork_images].sort((a, b) => a.sort_order - b.sort_order);
  const direction = formData.get("direction") === "up" ? "up" : "down";
  const moved = moveInList(images, images.findIndex((i) => i.id === image.id), direction);
  if (!moved) return;
  await saveOrder("artwork_images", moved);
  published();
}

export async function deleteArtworkImage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const loaded = await loadImage(formData);
  if (!loaded) return NOT_FOUND;
  const { supabase, artwork, image } = loaded;
  if (!canRemoveImage(artwork.status, artwork.artwork_images.length)) {
    return {
      ok: false,
      message: "A obra está publicada e esta é a única foto. Envie outra antes, ou volte a obra para rascunho.",
    };
  }
  const newCover = nextCoverAfterRemoval(
    artwork.artwork_images.map((i) => ({ id: i.id, isCover: i.is_cover, sortOrder: i.sort_order })),
    image.id,
  );
  const { error } = await supabase.from("artwork_images").delete().eq("id", image.id);
  if (error) return SAVE_FAILED;
  if (newCover) await supabase.from("artwork_images").update({ is_cover: true }).eq("id", newCover);
  await removeGalleryFiles([image.path]);
  published();
  return { ok: true, message: newCover ? "Foto apagada. A próxima foto virou a capa." : "Foto apagada." };
}
