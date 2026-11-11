import { z } from "zod";
import { optionPriceLabel } from "@/features/catalog/prices";
import { CUSTOM_CATEGORY } from "./form-types";
import { findModality, type OrderDraft, type ValidationContext } from "./schema";

// Escolhas do pedido em texto: as mesmas na revisão (navegador), no e-mail
// para a artista e na cópia gravada no pedido (orders.choices), que continua
// legível mesmo se o catálogo mudar depois.

export type SummaryRow = [label: string, value: string];

export type OrderSummary = {
  work: SummaryRow[];
  details: SummaryRow[];
};

export function summarizeOrder(draft: OrderDraft, ctx: ValidationContext): OrderSummary {
  const option = (id: string) => ctx.data.options.find((o) => o.id === id);
  const label = (id: string) => option(id)?.label ?? "";
  /** "Folha A4 (R$ 100)", "Outra técnica: carvão". */
  const describe = (id: string, customText = "") => {
    const chosen = option(id);
    if (!chosen) return "";
    const text = chosen.allowsCustom && customText.trim() ? `${chosen.label}: ${customText.trim()}` : chosen.label;
    const price = optionPriceLabel(chosen);
    return price ? `${text} (${price})` : text;
  };

  const modality = findModality(ctx, draft.modalityId);
  const category =
    draft.categoryId === CUSTOM_CATEGORY
      ? "Personalizado"
      : (ctx.data.categories.find((c) => c.id === draft.categoryId)?.name ?? "");
  const inspiration = ctx.data.artworks.find((a) => a.id === draft.artworkRefId);

  const delivery =
    modality?.deliveryKind === "digital"
      ? `Arquivo digital em alta resolução${draft.fileFormatOptionId ? ` · ${label(draft.fileFormatOptionId)}` : ""}`
      : describe(draft.deliveryOptionId) || "A combinar";

  return {
    work: [
      ["Modalidade", modality?.name ?? ""],
      ["Tipo de arte", category],
      ...(inspiration ? [["Inspirada em", inspiration.title] as SummaryRow] : []),
    ],
    details: [
      ["Tamanho", describe(draft.sizeOptionId, draft.customSize) || "Não se aplica"],
      ["Técnica", describe(draft.techniqueOptionId, draft.customTechnique) || "Não se aplica"],
      ...(draft.finishOptionId ? [["Moldura", describe(draft.finishOptionId)] as SummaryRow] : []),
      ["Entrega", delivery],
    ],
  };
}

const storedRowsSchema = z.array(z.tuple([z.string(), z.string()])).catch([]);
const storedSummarySchema = z.object({ obra: storedRowsSchema, detalhes: storedRowsSchema }).catch({ obra: [], detalhes: [] });

/** Lê a cópia das escolhas gravada no pedido (orders.choices). */
export function parseStoredSummary(choices: unknown): OrderSummary {
  const parsed = storedSummarySchema.parse(choices ?? {});
  return { work: parsed.obra, details: parsed.detalhes };
}
