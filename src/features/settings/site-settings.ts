import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { imageAssetSchema } from "@/features/catalog/mappers";
import { cacheTags } from "@/lib/cache-tags";
import { createPublicClient, rowsOrThrow } from "@/lib/supabase/server";

// Configurações e textos institucionais: tabela `settings` (chave → JSON),
// editável pelo painel (entrega 9). Valores entre colchetes ou null são
// pendências com a Carla (docs/decisoes.md).

const siteSchema = z.object({
  siteName: z.string().min(1),
  topBarMessage: z.string(),
  footerDescription: z.string(),
  instagramHandle: z.string().min(1),
  /** Com DDI 55, só dígitos. null = ainda não informado. */
  whatsappNumber: z.string().regex(/^55\d{10,11}$/).nullable(),
  contactEmail: z.email().nullable(),
});

const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    titleEmphasis: z.string(),
    description: z.string(),
    highlights: z.array(z.string()),
    image: imageAssetSchema,
    imageCaption: z.string(),
  }),
  /** Obra mostrada no bloco "Sua ideia, nossa arte." (foto → obra). */
  editorialExample: imageAssetSchema.nullable(),
  /** Seção "Como funciona": passos da encomenda, nas palavras da artista. */
  howItWorks: z.object({
    subtitle: z.string(),
    steps: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).min(1),
  }),
});

/** Parágrafos vazios não aparecem no site. */
const aboutSchema = z.object({
  heading: z.string(),
  signature: z.string(),
  intro: z.string(),
  story: z.string(),
  process: z.string(),
  differentials: z.string(),
  photo: imageAssetSchema,
});

/** Prazos e pagamento (informativos: o pagamento é combinado fora do site). */
const commerceSchema = z.object({
  leadTime: z.string(),
  paymentMethods: z.string(),
  paymentTerms: z.string(),
  priceNote: z.string(),
});

const settingsSchemas = { site: siteSchema, home: homeSchema, about: aboutSchema, commerce: commerceSchema } as const;
type SettingsKey = keyof typeof settingsSchemas;
const SETTINGS_KEYS = Object.keys(settingsSchemas) as SettingsKey[];

export type SiteSettings = z.infer<typeof siteSchema> &
  z.infer<typeof homeSchema> & { about: z.infer<typeof aboutSchema>; commerce: z.infer<typeof commerceSchema> };

/** Monta as configurações a partir das linhas da tabela. Lança erro se faltar ou sobrar algo inválido. */
export function parseSiteSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const invalid = SETTINGS_KEYS.filter((key) => !settingsSchemas[key].safeParse(values.get(key)).success);
  if (invalid.length > 0) {
    throw new Error(`Configurações ausentes ou inválidas no banco: ${invalid.join(", ")}.`);
  }
  return {
    ...siteSchema.parse(values.get("site")),
    ...homeSchema.parse(values.get("home")),
    about: aboutSchema.parse(values.get("about")),
    commerce: commerceSchema.parse(values.get("commerce")),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.settings);

  const result = await createPublicClient().from("settings").select("key, value").in("key", SETTINGS_KEYS);
  return parseSiteSettings(rowsOrThrow(result, "configurações"));
}
