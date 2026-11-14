import { z } from "zod";
import type { GalleryFolder } from "@/features/catalog/image-url";
import { orderFormSettingsSchema } from "@/features/orders/form-types";
import { normalizeBrPhone } from "@/features/orders/phone";
import {
  aboutSchema,
  commerceSchema,
  homeSchema,
  legalSchema,
  siteSchema,
} from "@/features/settings/site-settings";

// Textos e configurações editados no painel (entrega 9). Cada seção do painel
// muda uma parte de uma chave da tabela `settings`. O servidor junta o que veio
// do formulário com o valor atual e confere o resultado com o mesmo schema que
// o site usa para ler (se passar aqui, o site consegue mostrar).

export const notificationsSchema = z.object({ orderEmail: z.email() });

/** Schemas de leitura de cada chave (os mesmos do site). */
export const SETTINGS_SCHEMAS = {
  site: siteSchema,
  home: homeSchema,
  about: aboutSchema,
  commerce: commerceSchema,
  legal: legalSchema,
  notifications: notificationsSchema,
  order_form: orderFormSettingsSchema,
} as const;
export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;
export const SETTINGS_KEYS = Object.keys(SETTINGS_SCHEMAS) as SettingsKey[];

const required = (max: number, message = "Preencha este campo.") =>
  z.string().trim().min(1, message).max(max, `Use até ${max} caracteres.`);
const optional = (max: number) => z.string().trim().max(max, `Use até ${max} caracteres.`);

/** Uma frase por linha (linhas vazias saem). */
const lines = (maxItems: number, maxEach: number) =>
  z
    .string()
    .transform((text) =>
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().max(maxEach, `Cada linha com até ${maxEach} caracteres.`))
        .max(maxItems, `Use no máximo ${maxItems} linhas.`),
    );

/** "(75) 98849-8356" → "5575988498356". Vazio = sem WhatsApp no site. */
export const whatsappField = z.string().transform((text, ctx) => {
  if (text.trim() === "") return null;
  const national = normalizeBrPhone(text);
  if (!national) {
    ctx.addIssue({ code: "custom", message: "Número inválido. Use DDD + número, ex.: (75) 98849-8356." });
    return z.NEVER;
  }
  return `55${national}`;
});

const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const integer = (min: number, max: number, message: string) =>
  z.coerce.number(message).int(message).min(min, message).max(max, message);

export type ImageSlot = { name: string; folder: GalleryFolder; owner: string; required: boolean };

type Section = {
  key: SettingsKey;
  /** Valida o que veio do formulário (nomes dos campos = caminho dentro da chave). */
  patch: z.ZodType;
  images?: ImageSlot[];
};

export const SETTINGS_SECTIONS = {
  faixa: {
    key: "site",
    patch: z.object({ topBarMessage: required(120), footerDescription: optional(300) }),
  },
  contato: {
    key: "site",
    patch: z.object({
      whatsappNumber: whatsappField,
      contactEmail: z.union([z.literal(""), z.email("E-mail inválido.")]).transform((v) => v || null),
      instagramHandle: z
        .string()
        .trim()
        .transform((v) => v.replace(/^@/, ""))
        .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Escreva só o nome do perfil, ex.: croquiseflores.")),
    }),
  },
  destaque: {
    key: "home",
    patch: z.object({
      hero: z.object({
        eyebrow: optional(80),
        title: required(80),
        titleEmphasis: optional(40),
        description: optional(400),
        highlights: lines(4, 60),
        imageCaption: optional(120),
      }),
    }),
    images: [{ name: "hero.image", folder: "site", owner: "inicio", required: true }],
  },
  exemplo: {
    key: "home",
    patch: z.object({}),
    images: [{ name: "editorialExample", folder: "site", owner: "inicio", required: false }],
  },
  passos: {
    key: "home",
    patch: z.object({
      howItWorks: z.object({
        subtitle: optional(160),
        steps: z
          .array(z.object({ title: required(60, "Escreva o título do passo."), text: required(300, "Escreva o passo.") }))
          .min(1, "Deixe pelo menos um passo.")
          .max(8, "Use no máximo 8 passos."),
      }),
    }),
  },
  sobre: {
    key: "about",
    patch: z.object({
      heading: required(80),
      signature: optional(80),
      intro: optional(1500),
      story: optional(1500),
      process: optional(1500),
      differentials: optional(1500),
    }),
    images: [{ name: "photo", folder: "site", owner: "sobre", required: true }],
  },
  comercial: {
    key: "commerce",
    patch: z.object({
      leadTime: optional(300),
      paymentMethods: optional(300),
      paymentTerms: optional(300),
      priceNote: optional(300),
    }),
  },
  privacidade: { key: "legal", patch: z.object({ privacy: optional(20000) }) },
  termos: { key: "legal", patch: z.object({ terms: optional(20000) }) },
  avisos: {
    key: "notifications",
    patch: z.object({ orderEmail: z.email("E-mail inválido.") }),
  },
  formulario: {
    key: "order_form",
    patch: z.object({
      minLeadDays: integer(0, 365, "Use um número de 0 a 365."),
      maxFiles: integer(0, 20, "Use um número de 0 a 20."),
      maxFileSizeMb: integer(1, 10, "Use um número de 1 a 10."),
      askPortfolioConsent: checkbox,
    }),
  },
} as const satisfies Record<string, Section>;

export type SettingsSectionId = keyof typeof SETTINGS_SECTIONS;
export const isSettingsSection = (value: unknown): value is SettingsSectionId =>
  typeof value === "string" && Object.hasOwn(SETTINGS_SECTIONS, value);

/**
 * Campos do formulário → objeto. "hero.title" vira { hero: { title } } e
 * "howItWorks.steps.0.title" vira um item de lista. Campos de controle
 * (section, $ACTION...) e de foto ficam de fora.
 */
export function formToObject(data: FormData, skip: readonly string[] = []): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [name, value] of data.entries()) {
    if (typeof value !== "string" || name === "section" || name.startsWith("$") || skip.includes(name)) continue;
    const parts = name.split(".");
    let node: Record<string, unknown> = root;
    for (const [i, part] of parts.entries()) {
      if (i === parts.length - 1) node[part] = value;
      else node = (node[part] ??= {}) as Record<string, unknown>;
    }
  }
  return toArrays(root) as Record<string, unknown>;
}

/** Objetos com chaves 0, 1, 2… viram listas (na ordem das chaves). */
function toArrays(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const entries = Object.entries(value).map(([k, v]) => [k, toArrays(v)] as const);
  if (entries.length > 0 && entries.every(([k]) => /^\d+$/.test(k))) {
    return entries.sort(([a], [b]) => Number(a) - Number(b)).map(([, v]) => v);
  }
  return Object.fromEntries(entries);
}

/** Junta a mudança com o valor atual. Listas são trocadas inteiras. */
export function mergeSettings(current: unknown, patch: unknown): unknown {
  if (!isPlainObject(current) || !isPlainObject(patch)) return patch;
  const merged: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(patch)) merged[key] = mergeSettings(current[key], value);
  return merged;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Coloca um valor num caminho "a.b.c" (cria os objetos que faltarem). */
export function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) node = (node[part] ??= {}) as Record<string, unknown>;
  node[parts.at(-1)!] = value;
}

export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, part) => (isPlainObject(node) ? node[part] : undefined), source);
}

/** Versão da política de privacidade gravada em cada pedido: data e hora da mudança (São Paulo). */
export function privacyVersion(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}`;
}
