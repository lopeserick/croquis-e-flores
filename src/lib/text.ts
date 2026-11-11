/** Minúsculas e sem acentos: "Técnica Mista" → "tecnica mista". Para buscas. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** "Técnica mista" → "tecnica-mista". Para endereços e filtros. */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
