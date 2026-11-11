import { z } from "zod";
import type { OptionKind, OptionRow } from "@/features/catalog/types";
import { BR_STATE_CODES } from "./br-states";
import { addDays, isValidIsoDate } from "./dates";
import { CUSTOM_CATEGORY, type OrderFormData } from "./form-types";
import { normalizeBrPhone } from "./phone";

// Regras do pedido. As MESMAS funções validam no navegador (cada etapa do
// configurador) e no servidor (envio, entrega 6): validação dupla, regra única.

export const LIMITS = {
  customText: 120,
  description: 2000,
  name: 120,
  email: 254,
  city: 80,
  notes: 1000,
  /** Data desejada até 2 anos à frente. */
  maxLeadDays: 730,
} as const;

/** Rascunho do pedido: o que o cliente preenche (sem as fotos, que vão à parte). */
export const orderDraftSchema = z.object({
  modalityId: z.string().catch(""),
  categoryId: z.string().catch(""),
  techniqueOptionId: z.string().catch(""),
  customTechnique: z.string().catch(""),
  sizeOptionId: z.string().catch(""),
  customSize: z.string().catch(""),
  finishOptionId: z.string().catch(""),
  fileFormatOptionId: z.string().catch(""),
  deliveryOptionId: z.string().catch(""),
  description: z.string().catch(""),
  desiredDate: z.string().catch(""),
  name: z.string().catch(""),
  email: z.string().catch(""),
  whatsapp: z.string().catch(""),
  city: z.string().catch(""),
  state: z.string().catch(""),
  notes: z.string().catch(""),
  privacyAccepted: z.boolean().catch(false),
  portfolioConsent: z.boolean().catch(false),
  /** Obra da galeria que inspirou o pedido. */
  artworkRefId: z.string().nullable().catch(null),
});

export type OrderDraft = z.infer<typeof orderDraftSchema>;
export type DraftField = keyof OrderDraft;
export type FieldErrors = Partial<Record<DraftField, string>>;

export const emptyDraft: OrderDraft = orderDraftSchema.parse({});

/** Lê um rascunho salvo (ou vindo da rede) sem confiar no formato. */
export function parseDraft(value: unknown): OrderDraft {
  const result = orderDraftSchema.safeParse(value);
  return result.success ? result.data : emptyDraft;
}

export const STEPS = [
  { number: 1, title: "Sua obra", short: "Obra" },
  { number: 2, title: "Técnica, tamanho e entrega", short: "Detalhes" },
  { number: 3, title: "Sua inspiração", short: "Inspiração" },
  { number: 4, title: "Seus dados", short: "Seus dados" },
  { number: 5, title: "Revisão", short: "Revisão" },
] as const;

export type StepNumber = (typeof STEPS)[number]["number"];
export const LAST_STEP: StepNumber = 5;

export type ValidationContext = {
  data: Pick<OrderFormData, "modalities" | "categories" | "options" | "artworks" | "settings">;
  /** Hoje em São Paulo (AAAA-MM-DD). */
  today: string;
};

// ---------------------------------------------------------------------------
// Opções disponíveis conforme a modalidade e as outras escolhas
// ---------------------------------------------------------------------------

/** Campo do rascunho de cada grupo de opções, na ordem em que aparecem na etapa 2. */
export const OPTION_FIELDS = {
  size: "sizeOptionId",
  technique: "techniqueOptionId",
  finish: "finishOptionId",
  file_format: "fileFormatOptionId",
  delivery: "deliveryOptionId",
} as const satisfies Record<OptionKind, DraftField>;

export type OptionField = (typeof OPTION_FIELDS)[OptionKind];
const OPTION_ENTRIES = Object.entries(OPTION_FIELDS) as [OptionKind, OptionField][];

export const findModality = (ctx: ValidationContext, id: string) =>
  ctx.data.modalities.find((m) => m.id === id) ?? null;

export const categoriesFor = (ctx: ValidationContext, modalityId: string) =>
  ctx.data.categories.filter((c) => c.modalityIds.includes(modalityId));

export const optionsFor = (ctx: ValidationContext, modalityId: string, kind: OptionKind): OptionRow[] =>
  ctx.data.options.filter((o) => o.modalityId === modalityId && o.kind === kind);

/**
 * Opções do grupo que valem para as escolhas atuais: as sem requisito e as
 * que dependem de algo já escolhido (ex.: moldura só para a folha A4).
 */
export function availableOptions(ctx: ValidationContext, draft: OrderDraft, kind: OptionKind): OptionRow[] {
  const selected = new Set(OPTION_ENTRIES.map(([, field]) => draft[field]).filter(Boolean));
  return optionsFor(ctx, draft.modalityId, kind).filter(
    (o) => o.requiresOptionIds.length === 0 || o.requiresOptionIds.some((id) => selected.has(id)),
  );
}

export const minDesiredDate = (ctx: ValidationContext) => addDays(ctx.today, ctx.data.settings.minLeadDays);
export const maxDesiredDate = (ctx: ValidationContext) => addDays(ctx.today, LIMITS.maxLeadDays);

const toBrDate = (iso: string) => iso.split("-").reverse().join("/");

const noOptions = Object.fromEntries(OPTION_ENTRIES.map(([, field]) => [field, ""])) as Record<OptionField, "">;

/**
 * Valores que não valem mais viram vazio: trocou de modalidade (a moldura
 * escolhida sai) ou de tamanho (a técnica de quadro sai ao escolher folha).
 * Também descarta ids que não existem mais no catálogo.
 */
export function sanitizeDraft(draft: OrderDraft, ctx: ValidationContext): OrderDraft {
  const artworkRefId = ctx.data.artworks.some((a) => a.id === draft.artworkRefId) ? draft.artworkRefId : null;
  const modality = findModality(ctx, draft.modalityId);
  if (!modality) {
    return {
      ...draft,
      ...noOptions,
      modalityId: "",
      categoryId: draft.categoryId === CUSTOM_CATEGORY ? CUSTOM_CATEGORY : "",
      artworkRefId,
    };
  }
  const categoryOk =
    draft.categoryId === CUSTOM_CATEGORY || categoriesFor(ctx, modality.id).some((c) => c.id === draft.categoryId);
  let next: OrderDraft = { ...draft, categoryId: categoryOk ? draft.categoryId : "", artworkRefId };
  // Tirar uma escolha pode invalidar outra que dependia dela: repete até estabilizar.
  for (let changed = true; changed; ) {
    changed = false;
    for (const [kind, field] of OPTION_ENTRIES) {
      if (next[field] && !availableOptions(ctx, next, kind).some((o) => o.id === next[field])) {
        next = { ...next, [field]: "" };
        changed = true;
      }
    }
  }
  return next;
}

/** Grupos com uma única opção (e sem campo livre) já vêm escolhidos. */
export function autoSelectSingleOptions(draft: OrderDraft, ctx: ValidationContext): OrderDraft {
  if (!findModality(ctx, draft.modalityId)) return draft;
  let next = draft;
  for (const [kind, field] of OPTION_ENTRIES) {
    if (next[field]) continue;
    const list = availableOptions(ctx, next, kind);
    if (list.length === 1 && !list[0].allowsCustom) next = { ...next, [field]: list[0].id };
  }
  return next;
}

// ---------------------------------------------------------------------------
// Validação por etapa
// ---------------------------------------------------------------------------

const emailSchema = z.email();

const OPTION_MESSAGES: Record<OptionKind, { required: string; custom?: string }> = {
  size: { required: "Escolha o tamanho.", custom: "Informe o tamanho que você quer." },
  technique: { required: "Escolha a técnica.", custom: "Descreva a técnica que você quer." },
  finish: { required: "Escolha se quer a obra com ou sem moldura." },
  file_format: { required: "Escolha o formato do arquivo." },
  delivery: { required: "Escolha como quer receber a obra." },
};

/** Campo livre de "Outra técnica" e "Tamanho personalizado". */
export const CUSTOM_FIELDS: Partial<Record<OptionKind, "customTechnique" | "customSize">> = {
  size: "customSize",
  technique: "customTechnique",
};

function validateOptionGroup(errors: FieldErrors, ctx: ValidationContext, draft: OrderDraft, kind: OptionKind) {
  const field = OPTION_FIELDS[kind];
  const messages = OPTION_MESSAGES[kind];
  const options = availableOptions(ctx, draft, kind);
  if (options.length === 0) return; // a artista não oferece escolha aqui
  const chosen = options.find((o) => o.id === draft[field]);
  if (!chosen) {
    errors[field] = messages.required;
    return;
  }
  const customField = CUSTOM_FIELDS[kind];
  if (chosen.allowsCustom && customField) {
    const text = draft[customField].trim();
    if (text.length < 2) errors[customField] = messages.custom;
    else if (text.length > LIMITS.customText) errors[customField] = `Use até ${LIMITS.customText} caracteres.`;
  }
}

export function validateStep(step: StepNumber, draft: OrderDraft, ctx: ValidationContext): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    const modality = findModality(ctx, draft.modalityId);
    if (!modality) errors.modalityId = "Escolha a modalidade da obra.";
    const categoryOk =
      draft.categoryId === CUSTOM_CATEGORY ||
      (modality && categoriesFor(ctx, modality.id).some((c) => c.id === draft.categoryId));
    if (!categoryOk) errors.categoryId = "Escolha o tipo de arte.";
  }

  if (step === 2) {
    if (!findModality(ctx, draft.modalityId)) {
      errors.modalityId = "Escolha a modalidade da obra.";
      return errors;
    }
    for (const [kind] of OPTION_ENTRIES) validateOptionGroup(errors, ctx, draft, kind);
  }

  if (step === 3) {
    const description = draft.description.trim();
    if (description.length < 10) errors.description = "Conte um pouco sobre a obra (pelo menos 10 caracteres).";
    else if (description.length > LIMITS.description) {
      errors.description = `Use até ${LIMITS.description} caracteres.`;
    }

    const min = minDesiredDate(ctx);
    if (!draft.desiredDate) errors.desiredDate = "Escolha a data em que gostaria de receber.";
    else if (!isValidIsoDate(draft.desiredDate)) errors.desiredDate = "Data inválida.";
    else if (draft.desiredDate < min) errors.desiredDate = `Escolha uma data a partir de ${toBrDate(min)}.`;
    else if (draft.desiredDate > maxDesiredDate(ctx)) {
      errors.desiredDate = `Escolha uma data até ${toBrDate(maxDesiredDate(ctx))}.`;
    }
  }

  if (step === 4) {
    const name = draft.name.trim().replace(/\s+/g, " ");
    if (name.length < 3 || !name.includes(" ")) errors.name = "Informe nome e sobrenome.";
    else if (name.length > LIMITS.name) errors.name = `Use até ${LIMITS.name} caracteres.`;

    const email = draft.email.trim();
    if (!email || email.length > LIMITS.email || !emailSchema.safeParse(email).success) {
      errors.email = "Informe um e-mail válido, como nome@exemplo.com.";
    }
    if (!normalizeBrPhone(draft.whatsapp)) errors.whatsapp = "Informe o WhatsApp com DDD, como (11) 91234-5678.";

    const city = draft.city.trim();
    if (city.length < 2) errors.city = "Informe sua cidade.";
    else if (city.length > LIMITS.city) errors.city = `Use até ${LIMITS.city} caracteres.`;
    if (!(BR_STATE_CODES as readonly string[]).includes(draft.state)) errors.state = "Escolha o estado.";
    if (draft.notes.trim().length > LIMITS.notes) errors.notes = `Use até ${LIMITS.notes} caracteres.`;
    if (!draft.privacyAccepted) {
      errors.privacyAccepted = "Para enviar, é preciso aceitar a política de privacidade.";
    }
  }

  return errors;
}

export const isEmpty = (errors: FieldErrors) => Object.keys(errors).length === 0;

/** Primeira etapa com pendência; 5 (revisão) quando tudo está certo. */
export function firstIncompleteStep(draft: OrderDraft, ctx: ValidationContext): StepNumber {
  for (const step of [1, 2, 3, 4] as const) {
    if (!isEmpty(validateStep(step, draft, ctx))) return step;
  }
  return LAST_STEP;
}

/** Pedido inteiro (usado antes do envio e, na entrega 6, no servidor). */
export function validateOrder(draft: OrderDraft, ctx: ValidationContext): FieldErrors {
  return Object.assign({}, ...([1, 2, 3, 4] as const).map((step) => validateStep(step, draft, ctx)));
}
