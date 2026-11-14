import type { z } from "zod";

// Apoio aos formulários do painel: leitura do FormData e erros por campo.
// As regras de cada formulário ficam no módulo de cada assunto (obras,
// catálogo, conteúdo) e valem igual no navegador e no servidor.

/** Resposta de uma Server Action do painel. `errors`: mensagem por campo (name do input). */
export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Para onde ir depois de salvar (ex.: obra recém-criada). */
  redirectTo?: string;
} | null;

export const SAVE_FAILED: FormState = { ok: false, message: "Não foi possível salvar. Tente de novo." };
export const NOT_FOUND: FormState = { ok: false, message: "Não encontrado. Recarregue a página." };

/** Texto do campo, sem espaços nas pontas ("" se ausente). */
export const formText = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

/** Caixa de seleção: marcada envia "on" (ou o value dela). */
export const formBool = (data: FormData, name: string) => data.get(name) !== null && data.get(name) !== "false";

/** Todos os valores de campos repetidos com o mesmo nome. */
export const formList = (data: FormData, name: string) => data.getAll(name).map((v) => String(v).trim());

/** Primeiro erro de cada campo, pela chave do caminho ("title", "steps.0.text"). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    errors[key] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError, message = "Confira os campos destacados."): FormState {
  return { ok: false, message, errors: fieldErrors(error) };
}

/** Troca a posição de um item com o vizinho. null quando não há para onde mover. */
export function moveInList<T>(items: readonly T[], index: number, direction: "up" | "down"): T[] | null {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return null;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

/** Endereço único: "retrato" → "retrato-2" se "retrato" já existe. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || "item";
  if (!taken.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
