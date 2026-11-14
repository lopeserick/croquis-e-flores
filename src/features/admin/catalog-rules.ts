import { z } from "zod";
import type { DeliveryKind, OptionKind } from "@/features/catalog/types";
import { slugify } from "@/lib/text";
import { parseReais } from "./order-status";

// Regras do catálogo e dos depoimentos (painel, entrega 9).

export const DELIVERY_KIND_LABELS: Record<DeliveryKind, string> = {
  fisica: "Obra física (entregue em mãos ou pelos Correios)",
  digital: "Digital (arquivo)",
};

/** Ordem em que os grupos aparecem no configurador. */
export const OPTION_KINDS: readonly OptionKind[] = ["size", "technique", "finish", "file_format", "delivery"];

export const OPTION_KIND_LABELS: Record<OptionKind, string> = {
  size: "Tamanhos",
  technique: "Técnicas",
  finish: "Molduras e acabamentos",
  file_format: "Formatos de arquivo",
  delivery: "Formas de entrega",
};

export const OPTION_KIND_SINGULAR: Record<OptionKind, string> = {
  size: "tamanho",
  technique: "técnica",
  finish: "moldura ou acabamento",
  file_format: "formato de arquivo",
  delivery: "forma de entrega",
};

/** Como o preço de cada tipo de opção aparece para o cliente. */
export const OPTION_PRICE_HINTS: Record<OptionKind, string> = {
  size: 'Preço "a partir de" desta obra neste tamanho. Em branco: sem preço no site.',
  technique: "Normalmente em branco (o preço vem do tamanho).",
  finish: "Valor somado ao tamanho. 0 = sem custo. Em branco: sem preço no site.",
  file_format: "Normalmente em branco (o preço vem do tamanho).",
  delivery: "Valor somado ao pedido. 0 = sem custo. Em branco: a combinar (ex.: frete dos Correios).",
};

export const isOptionKind = (value: unknown): value is OptionKind =>
  typeof value === "string" && (OPTION_KINDS as readonly string[]).includes(value);

export const isDeliveryKind = (value: unknown): value is DeliveryKind => value === "fisica" || value === "digital";

/** Campo de preço em reais ("90", "1.250,50") → centavos. Vazio = sem preço. */
export const priceField = z.string().transform((text, ctx) => {
  const cents = parseReais(text);
  if (cents === undefined) {
    ctx.addIssue({ code: "custom", message: "Valor inválido. Use o formato 90 ou 90,50." });
    return z.NEVER;
  }
  return cents;
});

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const name = (max: number) => z.string().trim().min(2, "Escreva o nome.").max(max, `Use até ${max} caracteres.`);
const text = (max: number) => z.string().trim().max(max, `Use até ${max} caracteres.`);

export const modalityFormSchema = z.object({
  name: name(60),
  description: text(600),
  active: z.boolean(),
});

export const newModalitySchema = modalityFormSchema.extend({
  deliveryKind: z.enum(["fisica", "digital"], "Escolha como a obra é entregue."),
});

export const categoryFormSchema = z.object({
  name: name(60),
  slug: z
    .string()
    .trim()
    .max(60, "Use até 60 caracteres.")
    .refine((s) => s === "" || slugPattern.test(s), "Use só letras minúsculas sem acento, números e hífens."),
  tagline: text(140),
  priceCents: priceField,
  active: z.boolean(),
  showOnHome: z.boolean(),
  modalityIds: z.array(z.uuid()),
});

export const categorySlug = (form: { slug: string; name: string }) => form.slug || slugify(form.name).slice(0, 60);

export const optionFormSchema = z.object({
  label: z.string().trim().min(1, "Escreva o nome da opção.").max(80, "Use até 80 caracteres."),
  description: text(300),
  priceCents: priceField,
  allowsCustom: z.boolean(),
  active: z.boolean(),
  requiresOptionIds: z.array(z.uuid()),
});

type OptionRef = { id: string; modalityId: string; kind: OptionKind };

/**
 * "Só aparece com" precisa apontar para opções da mesma modalidade e de outro
 * grupo (ex.: técnica "Nanquim" só com o tamanho "Folha A4").
 */
export function requiresProblem(option: Omit<OptionRef, "id"> & { id?: string }, requires: string[], all: OptionRef[]): string | null {
  for (const id of requires) {
    const target = all.find((o) => o.id === id);
    if (!target || target.modalityId !== option.modalityId) return "Escolha opções desta mesma modalidade.";
    if (target.id === option.id || target.kind === option.kind) return "Escolha opções de outro grupo (ex.: um tamanho).";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Depoimentos
// ---------------------------------------------------------------------------

export const testimonialFormSchema = z
  .object({
    name: name(80),
    location: text(80),
    body: z.string().trim().min(10, "Escreva o depoimento.").max(600, "Use até 600 caracteres."),
    rating: z.union([z.literal(""), z.coerce.number().int().min(1).max(5)]).transform((v) => (v === "" ? null : v)),
    consentNote: text(300),
    published: z.boolean(),
  })
  .refine((t) => !t.published || t.consentNote.length > 0, {
    path: ["consentNote"],
    message: "Para publicar, registre como e quando o cliente autorizou.",
  });
