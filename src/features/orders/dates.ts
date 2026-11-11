// Datas puras ("2026-11-20"), sem hora: a data desejada é um dia, não um
// instante. "Hoje" é sempre o de São Paulo, independente do fuso do aparelho.

export const TIME_ZONE = "America/Sao_Paulo";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Hoje em São Paulo, no formato AAAA-MM-DD. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** "2026-11-20" → "sexta-feira, 20 de novembro de 2026". */
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
