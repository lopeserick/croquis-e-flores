"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { OptionKind } from "@/features/catalog/types";
import { cacheTags } from "@/lib/cache-tags";
import type { Json } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/session";
import { slugify } from "@/lib/text";
import { requireAdmin } from "./auth";
import {
  categoryFormSchema,
  categorySlug,
  isOptionKind,
  modalityFormSchema,
  newModalitySchema,
  optionFormSchema,
  requiresProblem,
} from "./catalog-rules";
import { formBool, formList, formText, invalid, moveInList, NOT_FOUND, SAVE_FAILED, uniqueSlug, type FormState } from "./forms";
import { readImageField, removeGalleryFiles } from "./gallery-upload";
import { siteContentChanged } from "./site-cache";
import { saveOrder } from "./sort-order";

// Ações do catálogo: modalidades, coleções e opções de encomenda. Mesmo
// padrão das obras: confere o admin, grava com a sessão dele (RLS) e atualiza
// o site (configurador, galeria, "Tipos de obra").

const idSchema = z.uuid();
const changed = () => siteContentChanged(cacheTags.catalog);

async function existingSlugs(table: "modalities" | "categories", exceptId?: string) {
  const supabase = await createSessionClient();
  const { data } = await supabase.from(table).select("id, slug");
  return new Set((data ?? []).filter((r) => r.id !== exceptId).map((r) => r.slug));
}

async function nextSortOrder(table: "modalities" | "categories") {
  const supabase = await createSessionClient();
  const { data } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// Modalidades
// ---------------------------------------------------------------------------

export async function saveModality(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = formText(formData, "id");
  const fields = {
    name: formText(formData, "name"),
    description: formText(formData, "description"),
    active: formBool(formData, "active"),
  };
  const supabase = await createSessionClient();

  if (!id) {
    const parsed = newModalitySchema.safeParse({ ...fields, deliveryKind: formText(formData, "deliveryKind") });
    if (!parsed.success) return invalid(parsed.error);
    const slug = uniqueSlug(slugify(parsed.data.name).slice(0, 60), await existingSlugs("modalities"));
    const { data, error } = await supabase
      .from("modalities")
      .insert({
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        delivery_kind: parsed.data.deliveryKind,
        active: parsed.data.active,
        sort_order: await nextSortOrder("modalities"),
      })
      .select("id")
      .single();
    if (error || !data) return SAVE_FAILED;
    changed();
    redirect(`/admin/catalogo/modalidades/${data.id}?criada=1`);
  }

  if (!idSchema.safeParse(id).success) return NOT_FOUND;
  const parsed = modalityFormSchema.safeParse(fields);
  if (!parsed.success) return invalid(parsed.error);
  const { data: current } = await supabase.from("modalities").select("id, image").eq("id", id).maybeSingle();
  if (!current) return NOT_FOUND;
  const image = await readImageField(formData, "image", {
    folder: "modalidades",
    owner: id,
    current: (current.image as { path: string } | null) ?? null,
    required: false,
  });
  if (!image.ok) return { ok: false, message: "Confira a foto.", errors: { image: image.error } };

  const { error } = await supabase
    .from("modalities")
    .update({ ...parsed.data, image: image.value as Json })
    .eq("id", id);
  if (error) return SAVE_FAILED;
  await removeGalleryFiles([image.replaced]);
  changed();
  return { ok: true, message: "Modalidade salva." };
}

// ---------------------------------------------------------------------------
// Coleções
// ---------------------------------------------------------------------------

export async function saveCategory(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = formText(formData, "id");
  if (id && !idSchema.safeParse(id).success) return NOT_FOUND;
  const parsed = categoryFormSchema.safeParse({
    name: formText(formData, "name"),
    slug: formText(formData, "slug"),
    tagline: formText(formData, "tagline"),
    priceCents: formText(formData, "priceCents"),
    active: formBool(formData, "active"),
    showOnHome: formBool(formData, "showOnHome"),
    modalityIds: formList(formData, "modalityIds"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const form = parsed.data;
  const supabase = await createSessionClient();

  const slug = categorySlug(form);
  if (!slug) return { ok: false, message: "Confira os campos destacados.", errors: { slug: "Escreva o endereço." } };
  const taken = await existingSlugs("categories", id || undefined);
  if (form.slug && taken.has(slug)) {
    return { ok: false, message: "Confira os campos destacados.", errors: { slug: `Já existe uma coleção com o endereço "${slug}".` } };
  }
  const values = {
    name: form.name,
    slug: form.slug ? slug : uniqueSlug(slug, taken),
    tagline: form.tagline,
    price_cents: form.priceCents,
    active: form.active,
    show_on_home: form.showOnHome,
  };

  let categoryId = id;
  let replaced: string | null = null;
  if (!id) {
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...values, sort_order: await nextSortOrder("categories") })
      .select("id")
      .single();
    if (error || !data) return SAVE_FAILED;
    categoryId = data.id;
  } else {
    const { data: current } = await supabase.from("categories").select("id, image").eq("id", id).maybeSingle();
    if (!current) return NOT_FOUND;
    const image = await readImageField(formData, "image", {
      folder: "colecoes",
      owner: id,
      current: (current.image as { path: string } | null) ?? null,
      required: false,
    });
    if (!image.ok) return { ok: false, message: "Confira a foto.", errors: { image: image.error } };
    const { error } = await supabase
      .from("categories")
      .update({ ...values, image: image.value as Json })
      .eq("id", id);
    if (error) return SAVE_FAILED;
    replaced = image.replaced;
  }

  // Em quais modalidades a coleção aparece como "tipo de arte" no configurador.
  const { data: links } = await supabase.from("category_modalities").select("modality_id").eq("category_id", categoryId);
  const before = new Set((links ?? []).map((l) => l.modality_id));
  const after = new Set(form.modalityIds);
  const removed = [...before].filter((m) => !after.has(m));
  const added = [...after].filter((m) => !before.has(m));
  if (removed.length > 0) {
    await supabase.from("category_modalities").delete().eq("category_id", categoryId).in("modality_id", removed);
  }
  if (added.length > 0) {
    await supabase.from("category_modalities").insert(added.map((modality_id) => ({ category_id: categoryId, modality_id })));
  }

  await removeGalleryFiles([replaced]);
  changed();
  if (!id) redirect(`/admin/catalogo/colecoes/${categoryId}?criada=1`);
  return { ok: true, message: "Coleção salva." };
}

// ---------------------------------------------------------------------------
// Opções (tamanhos, técnicas, molduras, formatos, entrega)
// ---------------------------------------------------------------------------

export async function saveOption(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = formText(formData, "id");
  if (id && !idSchema.safeParse(id).success) return NOT_FOUND;
  const parsed = optionFormSchema.safeParse({
    label: formText(formData, "label"),
    description: formText(formData, "description"),
    priceCents: formText(formData, "priceCents"),
    allowsCustom: formBool(formData, "allowsCustom"),
    active: formBool(formData, "active"),
    requiresOptionIds: formList(formData, "requiresOptionIds"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const form = parsed.data;
  const supabase = await createSessionClient();

  // Opção existente: modalidade e grupo não mudam. Nova: vêm do link "Nova opção".
  let target: { modalityId: string; kind: OptionKind };
  if (id) {
    const { data } = await supabase.from("options").select("modality_id, kind").eq("id", id).maybeSingle();
    if (!data) return NOT_FOUND;
    target = { modalityId: data.modality_id, kind: data.kind };
  } else {
    const modalityId = idSchema.safeParse(formText(formData, "modalityId"));
    const kind = formText(formData, "kind");
    if (!modalityId.success || !isOptionKind(kind)) return NOT_FOUND;
    target = { modalityId: modalityId.data, kind };
  }

  const { data: siblings } = await supabase.from("options").select("id, modality_id, kind, sort_order").eq("modality_id", target.modalityId);
  const all = (siblings ?? []).map((o) => ({ id: o.id, modalityId: o.modality_id, kind: o.kind }));
  const problem = requiresProblem({ id: id || undefined, ...target }, form.requiresOptionIds, all);
  if (problem) return { ok: false, message: "Confira os campos destacados.", errors: { requiresOptionIds: problem } };

  const values = {
    label: form.label,
    description: form.description,
    price_cents: form.priceCents,
    allows_custom: form.allowsCustom,
    active: form.active,
    requires_option_ids: form.requiresOptionIds,
  };
  if (id) {
    const { error } = await supabase.from("options").update(values).eq("id", id);
    if (error) return SAVE_FAILED;
    changed();
    return { ok: true, message: "Opção salva." };
  }

  const lastOrder = Math.max(0, ...(siblings ?? []).filter((o) => o.kind === target.kind).map((o) => o.sort_order));
  const { error } = await supabase
    .from("options")
    .insert({ ...values, modality_id: target.modalityId, kind: target.kind, sort_order: lastOrder + 1 });
  if (error) return SAVE_FAILED;
  changed();
  redirect(`/admin/catalogo/modalidades/${target.modalityId}?opcao=criada#opcoes`);
}

// ---------------------------------------------------------------------------
// Ordem
// ---------------------------------------------------------------------------

const direction = (formData: FormData) => (formData.get("direction") === "up" ? "up" : "down");

export async function moveModality(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("modalities").select("id, sort_order").order("sort_order").order("name");
  const moved = data && moveInList(data, data.findIndex((r) => r.id === formText(formData, "id")), direction(formData));
  if (!moved) return;
  await saveOrder("modalities", moved);
  changed();
}

export async function moveCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("categories").select("id, sort_order").order("sort_order").order("name");
  const moved = data && moveInList(data, data.findIndex((r) => r.id === formText(formData, "id")), direction(formData));
  if (!moved) return;
  await saveOrder("categories", moved);
  changed();
}

/** Sobe ou desce a opção dentro do grupo dela (ex.: entre os tamanhos). */
export async function moveOption(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data: option } = await supabase
    .from("options")
    .select("id, modality_id, kind")
    .eq("id", formText(formData, "id"))
    .maybeSingle();
  if (!option) return;
  const { data } = await supabase
    .from("options")
    .select("id, sort_order")
    .eq("modality_id", option.modality_id)
    .eq("kind", option.kind)
    .order("sort_order")
    .order("label");
  const moved = data && moveInList(data, data.findIndex((r) => r.id === option.id), direction(formData));
  if (!moved) return;
  await saveOrder("options", moved);
  changed();
}
