// WhatsApp brasileiro: DDD + número, com ou sem o 55 na frente.

/**
 * Devolve o número nacional (10 ou 11 dígitos) ou null se não for válido.
 * Celular tem 11 dígitos e começa com 9 depois do DDD.
 */
export function normalizeBrPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (!/^[1-9][1-9]/.test(digits)) return null; // DDD de 11 a 99
  if (digits.length === 11 && digits[2] !== "9") return null;
  return digits;
}

/** Máscara enquanto digita: "75988498356" → "(75) 98849-8356". */
export function formatBrPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const local = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  if (local.length <= split) return `(${d.slice(0, 2)}) ${local}`;
  return `(${d.slice(0, 2)}) ${local.slice(0, split)}-${local.slice(split)}`;
}

/** Só os dígitos do que foi digitado, limitado ao tamanho de um número nacional. */
export function phoneInputDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  return digits.slice(0, 11);
}
