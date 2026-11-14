"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cacheTags } from "@/lib/cache-tags";
import type { Json } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";
import { testimonialFormSchema } from "./catalog-rules";
import { formBool, formText, invalid, moveInList, NOT_FOUND, SAVE_FAILED, type FormState } from "./forms";
import { createGalleryUpload, readImageField, removeGalleryFiles, type GalleryUploadResult } from "./gallery-upload";
import {
  formToObject,
  getPath,
  isSettingsSection,
  mergeSettings,
  privacyVersion,
  setPath,
  SETTINGS_SCHEMAS,
  SETTINGS_SECTIONS,
  type ImageSlot,
} from "./settings-forms";
import { siteContentChanged } from "./site-cache";
import { saveOrder } from "./sort-order";

// Ações de conteúdo: depoimentos, textos e configurações do site.

const idSchema = z.uuid();

/** Link assinado para enviar uma foto do painel (coleção, modalidade, textos do site). */
export async function prepareGalleryImage(input: { folder: string; owner: string; mime: string; size: number }): Promise<GalleryUploadResult> {
  return createGalleryUpload(input);
}

// ---------------------------------------------------------------------------
// Depoimentos
// ---------------------------------------------------------------------------

export async function saveTestimonial(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = formText(formData, "id");
  if (id && !idSchema.safeParse(id).success) return NOT_FOUND;
  const parsed = testimonialFormSchema.safeParse({
    name: formText(formData, "name"),
    location: formText(formData, "location"),
    body: formText(formData, "body"),
    rating: formText(formData, "rating"),
    consentNote: formText(formData, "consentNote"),
    published: formBool(formData, "published"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const t = parsed.data;
  const values = {
    name: t.name,
    location: t.location || null,
    body: t.body,
    rating: t.rating,
    consent_note: t.consentNote,
    published: t.published,
  };
  const supabase = await createSessionClient();

  if (id) {
    const { data, error } = await supabase.from("testimonials").update(values).eq("id", id).select("id");
    if (error) return SAVE_FAILED;
    if (!data?.length) return NOT_FOUND;
    siteContentChanged(cacheTags.testimonials);
    return { ok: true, message: t.published ? "Depoimento salvo e publicado." : "Depoimento salvo (não aparece no site)." };
  }

  const { data: last } = await supabase.from("testimonials").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { error } = await supabase.from("testimonials").insert({ ...values, sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
  if (error) return SAVE_FAILED;
  siteContentChanged(cacheTags.testimonials);
  redirect("/admin/depoimentos?salvo=1");
}

export async function deleteTestimonial(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return NOT_FOUND;
  const supabase = await createSessionClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id.data);
  if (error) return SAVE_FAILED;
  siteContentChanged(cacheTags.testimonials);
  redirect("/admin/depoimentos?apagado=1");
}

export async function moveTestimonial(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("testimonials").select("id, sort_order").order("sort_order").order("created_at");
  const index = data?.findIndex((t) => t.id === formText(formData, "id")) ?? -1;
  const moved = data && moveInList(data, index, formData.get("direction") === "up" ? "up" : "down");
  if (!moved) return;
  await saveOrder("testimonials", moved);
  siteContentChanged(cacheTags.testimonials);
}

// ---------------------------------------------------------------------------
// Textos e configurações
// ---------------------------------------------------------------------------

export async function saveSettingsSection(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const sectionId = formData.get("section");
  if (!isSettingsSection(sectionId)) return NOT_FOUND;
  const section = SETTINGS_SECTIONS[sectionId];
  const images: readonly ImageSlot[] = "images" in section ? section.images : [];

  const patch = section.patch.safeParse(formToObject(formData, images.map((i) => i.name)));
  if (!patch.success) return invalid(patch.error);

  const supabase = await createSessionClient();
  const { data: row } = await supabase.from("settings").select("value").eq("key", section.key).maybeSingle();
  if (!row) return NOT_FOUND;
  const current = row.value;

  const value = patch.data as Record<string, unknown>;
  const replaced: (string | null)[] = [];
  for (const slot of images) {
    const image = await readImageField(formData, slot.name, {
      folder: slot.folder,
      owner: slot.owner,
      current: (getPath(current, slot.name) as { path: string } | null | undefined) ?? null,
      required: slot.required,
    });
    if (!image.ok) return { ok: false, message: "Confira a foto.", errors: { [slot.name]: image.error } };
    setPath(value, slot.name, image.value);
    replaced.push(image.replaced);
  }

  // O resultado precisa continuar legível pelo site (mesmo schema da leitura).
  const merged = SETTINGS_SCHEMAS[section.key].safeParse(mergeSettings(current, value));
  if (!merged.success) {
    console.error("[painel] configuração inválida depois de juntar", section.key, merged.error.issues);
    return SAVE_FAILED;
  }
  const { error } = await supabase.from("settings").update({ value: merged.data as { [key: string]: Json } }).eq("key", section.key);
  if (error) return SAVE_FAILED;

  // Texto da política mudou: os próximos pedidos registram a nova versão do aceite.
  if (sectionId === "privacidade" && getPath(current, "privacy") !== getPath(merged.data, "privacy")) {
    const { data: form } = await supabase.from("settings").select("value").eq("key", "order_form").maybeSingle();
    const orderForm = SETTINGS_SCHEMAS.order_form.safeParse(form?.value);
    if (orderForm.success) {
      await supabase
        .from("settings")
        .update({ value: { ...orderForm.data, privacyPolicyVersion: privacyVersion() } })
        .eq("key", "order_form");
    }
  }

  await removeGalleryFiles(replaced);
  siteContentChanged(cacheTags.settings);
  return { ok: true, message: "Salvo. O site já mostra a mudança." };
}
