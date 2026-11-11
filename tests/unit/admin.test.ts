import { describe, expect, it } from "vitest";
import {
  centsToInput,
  formatDateTime,
  formatShortDate,
  isOrderStatus,
  ORDER_STATUSES,
  parseReais,
  STATUS_LABELS,
} from "@/features/admin/order-status";
import { parseStoredSummary } from "@/features/orders/summary";

describe("valor do orçamento em reais", () => {
  it("aceita os jeitos comuns de escrever", () => {
    expect(parseReais("150")).toBe(15000);
    expect(parseReais("150,5")).toBe(15050);
    expect(parseReais("R$ 1.250,00")).toBe(125000);
    expect(parseReais("1250,99")).toBe(125099);
  });

  it("vazio apaga o valor; texto estranho é recusado", () => {
    expect(parseReais("  ")).toBeNull();
    expect(parseReais("abc")).toBeUndefined();
    expect(parseReais("1.25")).toBeUndefined(); // ponto como decimal é ambíguo
    expect(parseReais("150,999")).toBeUndefined();
    expect(parseReais("-10")).toBeUndefined();
    expect(parseReais("2.000.000,00")).toBeUndefined(); // acima de R$ 1 milhão
  });

  it("volta para o campo no formato brasileiro", () => {
    expect(centsToInput(125050)).toBe("1.250,50");
    expect(centsToInput(null)).toBe("");
  });
});

describe("datas e status do painel", () => {
  it("horário mostrado é o de São Paulo", () => {
    expect(formatDateTime("2026-11-11T17:30:00Z")).toBe("11/11/2026, 14:30");
  });

  it("data pura não muda de dia com o fuso", () => {
    expect(formatShortDate("2027-03-01")).toBe("01/03/2027");
  });

  it("todo status tem nome em português e só os do banco são aceitos", () => {
    for (const status of ORDER_STATUSES) expect(STATUS_LABELS[status]).toBeTruthy();
    expect(isOrderStatus("aprovado")).toBe(true);
    expect(isOrderStatus("em_analise")).toBe(false); // status antigo
    expect(isOrderStatus("apagado")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
  });
});

describe("escolhas gravadas no pedido", () => {
  it("lê a cópia em texto", () => {
    const summary = parseStoredSummary({
      obra: [["Modalidade", "Ilustração digital"]],
      detalhes: [["Tamanho", "A4 (R$ 80)"]],
    });
    expect(summary).toEqual({ work: [["Modalidade", "Ilustração digital"]], details: [["Tamanho", "A4 (R$ 80)"]] });
  });

  it("formato inesperado não quebra a página do pedido", () => {
    expect(parseStoredSummary(null)).toEqual({ work: [], details: [] });
    expect(parseStoredSummary({ obra: "x" })).toEqual({ work: [], details: [] });
  });
});
