import type { Json } from "@/lib/supabase/database.types";
import { CUSTOM_CATEGORY } from "./form-types";
import { normalizeBrPhone } from "./phone";
import type { OrderDraft, ValidationContext } from "./schema";
import type { OrderSummary } from "./summary";

// Linha de public.orders montada a partir do rascunho JÁ validado
// (validateOrder). Vai para a função create_order como JSON.

const orNull = (id: string) => id || null;

export function buildOrderRecord(
  draft: OrderDraft,
  ctx: ValidationContext,
  summary: OrderSummary,
  extra: { idempotencyKey: string; ipHash: string },
): { [key: string]: Json } {
  const option = (id: string) => ctx.data.options.find((o) => o.id === id);
  const customText = (id: string, text: string) => (option(id)?.allowsCustom ? text.trim() : null);
  const { settings } = ctx.data;
  return {
    idempotency_key: extra.idempotencyKey,
    modality_id: draft.modalityId,
    category_id: draft.categoryId === CUSTOM_CATEGORY ? null : orNull(draft.categoryId),
    technique_option_id: orNull(draft.techniqueOptionId),
    size_option_id: orNull(draft.sizeOptionId),
    finish_option_id: orNull(draft.finishOptionId),
    file_format_option_id: orNull(draft.fileFormatOptionId),
    delivery_option_id: orNull(draft.deliveryOptionId),
    // Cópia em texto: o pedido continua legível se o catálogo mudar.
    choices: { obra: summary.work, detalhes: summary.details },
    custom_technique: customText(draft.techniqueOptionId, draft.customTechnique),
    custom_size: customText(draft.sizeOptionId, draft.customSize),
    desired_date: draft.desiredDate,
    description: draft.description.trim(),
    notes: draft.notes.trim() || null,
    customer_name: draft.name.trim().replace(/\s+/g, " "),
    customer_email: draft.email.trim().toLowerCase(),
    customer_whatsapp: normalizeBrPhone(draft.whatsapp) ?? draft.whatsapp,
    city: draft.city.trim(),
    state: draft.state,
    privacy_version: settings.privacyPolicyVersion,
    portfolio_consent: settings.askPortfolioConsent && draft.portfolioConsent,
    artwork_ref_id: draft.artworkRefId,
    ip_hash: extra.ipHash,
  };
}
