import type { OptionRow } from "./types";

// Preços de referência (docs/conteudo-carla.md). O valor final é sempre
// confirmado pela artista no orçamento.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 9000 → "R$ 90"; 9050 → "R$ 90,50". */
export function formatPrice(cents: number): string {
  return brl
    .format(cents / 100)
    .replace(/,00$/, "")
    .replace(/ /g, " ");
}

/** Texto do preço ao lado da opção: "R$ 90", "+ R$ 50", "sem custo" ou nada. */
export function optionPriceLabel(option: Pick<OptionRow, "kind" | "priceCents">): string | null {
  if (option.priceCents === null) return null;
  if (option.kind === "finish" || option.kind === "delivery") {
    return option.priceCents === 0 ? "sem custo" : `+ ${formatPrice(option.priceCents)}`;
  }
  return formatPrice(option.priceCents);
}

/** Menor preço de tamanho da modalidade ("a partir de"). null quando nenhum tamanho tem preço. */
export function startingPrice(options: Pick<OptionRow, "modalityId" | "kind" | "priceCents">[], modalityId: string) {
  const prices = options
    .filter((o) => o.modalityId === modalityId && o.kind === "size" && o.priceCents !== null)
    .map((o) => o.priceCents as number);
  return prices.length > 0 ? Math.min(...prices) : null;
}
