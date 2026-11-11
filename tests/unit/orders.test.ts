import { describe, expect, it } from "vitest";
import { formatPrice, optionPriceLabel, startingPrice } from "@/features/catalog/prices";
import type { OptionRow } from "@/features/catalog/types";
import { addDays, formatLongDate, isValidIsoDate, todayInSaoPaulo } from "@/features/orders/dates";
import { CUSTOM_CATEGORY, type OrderFormData } from "@/features/orders/form-types";
import { formatBrPhone, normalizeBrPhone, phoneInputDigits } from "@/features/orders/phone";
import { checkReference } from "@/features/orders/references";
import {
  autoSelectSingleOptions,
  emptyDraft,
  firstIncompleteStep,
  parseDraft,
  sanitizeDraft,
  validateOrder,
  validateStep,
  type OrderDraft,
  type ValidationContext,
} from "@/features/orders/schema";
import { detectImageType } from "@/lib/security/file-signature";

const image = { path: "/x.jpg", alt: "x", width: 1, height: 1, focalX: 50, focalY: 50 };

const data: ValidationContext["data"] = {
  modalities: [
    { id: "mao", slug: "obra-feita-a-mao", name: "Obra feita à mão", description: "", deliveryKind: "fisica", image },
    { id: "dig", slug: "ilustracao-digital", name: "Ilustração digital", description: "", deliveryKind: "digital", image },
  ],
  categories: [
    { id: "ret", slug: "retratos", name: "Retratos", image, priceCents: null, modalityIds: ["mao", "dig"] },
    { id: "cro", slug: "croquis", name: "Croquis", image: null, priceCents: 7000, modalityIds: ["mao"] },
  ],
  options: (
    [
      // Folha (20 × 30) aceita nanquim e moldura; quadro só acrílica, sem moldura.
      { id: "20x30", modalityId: "mao", kind: "size", label: "Folha 20 × 30 cm", priceCents: 10000 },
      { id: "quadro", modalityId: "mao", kind: "size", label: "Quadro 10 × 15 cm", priceCents: 9000 },
      { id: "nanquim", modalityId: "mao", kind: "technique", label: "Nanquim", requiresOptionIds: ["20x30"] },
      { id: "outra", modalityId: "mao", kind: "technique", label: "Outra técnica", allowsCustom: true, requiresOptionIds: ["20x30"] },
      { id: "acrilica", modalityId: "mao", kind: "technique", label: "Tinta acrílica", requiresOptionIds: ["quadro"] },
      { id: "sem", modalityId: "mao", kind: "finish", label: "Sem moldura", requiresOptionIds: ["20x30"] },
      { id: "com", modalityId: "mao", kind: "finish", label: "Com moldura", priceCents: 5000, requiresOptionIds: ["20x30"] },
      { id: "retirada", modalityId: "mao", kind: "delivery", label: "Retirada", priceCents: 0 },
      { id: "correios", modalityId: "mao", kind: "delivery", label: "Correios" },
      { id: "dig-tec", modalityId: "dig", kind: "technique", label: "Ilustração digital" },
      { id: "a4", modalityId: "dig", kind: "size", label: "A4", priceCents: 8000 },
      { id: "png", modalityId: "dig", kind: "file_format", label: "PNG" },
      { id: "pdf", modalityId: "dig", kind: "file_format", label: "PDF" },
    ] as (Pick<OptionRow, "id" | "modalityId" | "kind" | "label"> & Partial<OptionRow>)[]
  ).map((o, i) => ({ description: "", allowsCustom: false, priceCents: null, requiresOptionIds: [], sortOrder: i, ...o })),
  artworks: [{ id: "obra1", slug: "obra-1", title: "Obra 1", categoryId: "ret", modalityId: "dig", cover: image }],
  settings: {
    maxFiles: 10,
    maxFileSizeMb: 10,
    minLeadDays: 1,
    askPortfolioConsent: true,
    privacyPolicyVersion: "teste",
  } satisfies OrderFormData["settings"],
};

const ctx: ValidationContext = { data, today: "2026-11-10" };

const complete: OrderDraft = {
  ...emptyDraft,
  modalityId: "mao",
  categoryId: "ret",
  techniqueOptionId: "nanquim",
  sizeOptionId: "20x30",
  finishOptionId: "com",
  deliveryOptionId: "retirada",
  description: "Retrato da minha avó no jardim, em tons de rosa.",
  desiredDate: "2026-12-20",
  name: "Maria Souza",
  email: "maria@exemplo.com",
  whatsapp: "75988498356",
  city: "Feira de Santana",
  state: "BA",
  privacyAccepted: true,
};

describe("datas", () => {
  it("hoje é o de São Paulo, mesmo perto da meia-noite UTC", () => {
    // 02:00 UTC do dia 11 ainda é 23:00 do dia 10 em São Paulo.
    expect(todayInSaoPaulo(new Date("2026-11-11T02:00:00Z"))).toBe("2026-11-10");
  });

  it("soma dias atravessando mês e ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("rejeita datas que não existem", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
  });

  it("escreve a data por extenso em português", () => {
    expect(formatLongDate("2026-11-20")).toBe("sexta-feira, 20 de novembro de 2026");
  });
});

describe("WhatsApp", () => {
  it("aceita celular e fixo com DDD, com ou sem 55 e máscara", () => {
    expect(normalizeBrPhone("(75) 98849-8356")).toBe("75988498356");
    expect(normalizeBrPhone("+55 75 98849-8356")).toBe("75988498356");
    expect(normalizeBrPhone("7532214567")).toBe("7532214567");
  });

  it("rejeita sem DDD, DDD inválido ou celular sem o 9", () => {
    expect(normalizeBrPhone("988498356")).toBeNull();
    expect(normalizeBrPhone("05988498356")).toBeNull();
    expect(normalizeBrPhone("75888498356")).toBeNull();
  });

  it("formata enquanto digita", () => {
    expect(formatBrPhone("7")).toBe("(7");
    expect(formatBrPhone("759884")).toBe("(75) 9884");
    expect(formatBrPhone("75988498356")).toBe("(75) 98849-8356");
    expect(formatBrPhone("7532214567")).toBe("(75) 3221-4567");
    expect(phoneInputDigits("+55 (75) 98849-8356")).toBe("75988498356");
  });
});

describe("tipo real das fotos", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
  const pdf = new TextEncoder().encode("%PDF-1.7 xxxx");

  it("reconhece JPEG, PNG e WebP pelos bytes", () => {
    expect(detectImageType(jpeg)).toBe("image/jpeg");
    expect(detectImageType(png)).toBe("image/png");
    expect(detectImageType(webp)).toBe("image/webp");
    expect(detectImageType(pdf)).toBeNull();
  });

  it("arquivo com extensão de imagem mas conteúdo de outro tipo é recusado", () => {
    const result = checkReference({ name: "foto.jpg", size: 1000 }, pdf, { maxFileSizeMb: 10 });
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/não é uma imagem válida/) });
  });

  it("recusa extensão não aceita, arquivo vazio e acima do limite", () => {
    expect(checkReference({ name: "foto.heic", size: 1000 }, jpeg, { maxFileSizeMb: 10 }).ok).toBe(false);
    expect(checkReference({ name: "foto.jpg", size: 0 }, jpeg, { maxFileSizeMb: 10 }).ok).toBe(false);
    const big = checkReference({ name: "foto.jpg", size: 11 * 1024 * 1024 }, jpeg, { maxFileSizeMb: 10 });
    expect(big).toEqual({ ok: false, reason: expect.stringMatching(/limite é 10 MB/) });
  });

  it("aceita imagem válida e diz o tipo real", () => {
    expect(checkReference({ name: "Foto.PNG", size: 2000 }, png, { maxFileSizeMb: 10 })).toEqual({
      ok: true,
      mime: "image/png",
    });
  });
});

describe("etapas do pedido", () => {
  it("pedido completo passa em todas as etapas", () => {
    expect(validateOrder(complete, ctx)).toEqual({});
    expect(firstIncompleteStep(complete, ctx)).toBe(5);
  });

  it("etapa 1 exige modalidade e tipo de arte disponível nela", () => {
    expect(Object.keys(validateStep(1, emptyDraft, ctx))).toEqual(["modalityId", "categoryId"]);
    // "Croquis" não é oferecido na modalidade digital.
    expect(validateStep(1, { ...complete, modalityId: "dig", categoryId: "cro" }, ctx)).toHaveProperty("categoryId");
    expect(validateStep(1, { ...complete, categoryId: CUSTOM_CATEGORY }, ctx)).toEqual({});
  });

  it("etapa 2: técnica de outra modalidade não vale", () => {
    expect(validateStep(2, { ...complete, techniqueOptionId: "dig-tec" }, ctx)).toHaveProperty("techniqueOptionId");
  });

  it("etapa 2: 'Outra técnica' exige descrever", () => {
    const draft = { ...complete, techniqueOptionId: "outra", customTechnique: " " };
    expect(validateStep(2, draft, ctx)).toEqual({ customTechnique: "Descreva a técnica que você quer." });
    expect(validateStep(2, { ...draft, customTechnique: "Carvão" }, ctx)).toEqual({});
  });

  it("etapa 2: obra física pede moldura; digital pede formato do arquivo", () => {
    expect(validateStep(2, { ...complete, finishOptionId: "" }, ctx)).toHaveProperty("finishOptionId");
    const digital = { ...complete, modalityId: "dig", techniqueOptionId: "dig-tec", sizeOptionId: "a4", finishOptionId: "" };
    expect(validateStep(2, digital, ctx)).toEqual({ fileFormatOptionId: "Escolha o formato do arquivo." });
    expect(validateStep(2, { ...digital, fileFormatOptionId: "pdf" }, ctx)).toEqual({});
  });

  it("etapa 2: técnica e moldura dependem do tamanho", () => {
    const quadro = { ...complete, sizeOptionId: "quadro" };
    // Nanquim e moldura só valem para a folha.
    expect(validateStep(2, quadro, ctx)).toEqual({ techniqueOptionId: "Escolha a técnica." });
    // No quadro, a moldura nem é perguntada.
    expect(validateStep(2, { ...quadro, techniqueOptionId: "acrilica", finishOptionId: "" }, ctx)).toEqual({});
  });

  it("etapa 2: obra física pede a forma de entrega", () => {
    expect(validateStep(2, { ...complete, deliveryOptionId: "" }, ctx)).toEqual({
      deliveryOptionId: "Escolha como quer receber a obra.",
    });
  });

  it("etapa 3: data a partir de amanhã (prazo mínimo configurável) e até 2 anos", () => {
    expect(validateStep(3, { ...complete, desiredDate: "2026-11-10" }, ctx)).toEqual({
      desiredDate: "Escolha uma data a partir de 11/11/2026.",
    });
    expect(validateStep(3, { ...complete, desiredDate: "2026-11-11" }, ctx)).toEqual({});
    expect(validateStep(3, { ...complete, desiredDate: "2029-01-01" }, ctx)).toHaveProperty("desiredDate");
    const slower = { ...ctx, data: { ...data, settings: { ...data.settings, minLeadDays: 15 } } };
    expect(validateStep(3, { ...complete, desiredDate: "2026-11-20" }, slower)).toHaveProperty("desiredDate");
  });

  it("etapa 3: descrição curta demais é recusada", () => {
    expect(validateStep(3, { ...complete, description: "oi" }, ctx)).toHaveProperty("description");
  });

  it("etapa 4: nome completo, e-mail, WhatsApp, cidade, UF e aceite da política", () => {
    const errors = validateStep(
      4,
      { ...complete, name: "Maria", email: "maria@", whatsapp: "123", city: "", state: "XX", privacyAccepted: false },
      ctx,
    );
    expect(Object.keys(errors).sort()).toEqual(["city", "email", "name", "privacyAccepted", "state", "whatsapp"]);
  });

  it("primeira etapa pendente orienta para onde voltar", () => {
    expect(firstIncompleteStep(emptyDraft, ctx)).toBe(1);
    expect(firstIncompleteStep({ ...complete, description: "" }, ctx)).toBe(3);
  });
});

describe("rascunho", () => {
  it("trocar a modalidade limpa escolhas que não valem mais", () => {
    const draft = sanitizeDraft({ ...complete, modalityId: "dig" }, ctx);
    expect(draft).toMatchObject({
      categoryId: "ret", // retrato existe nas duas
      techniqueOptionId: "",
      sizeOptionId: "",
      finishOptionId: "",
      fileFormatOptionId: "",
    });
  });

  it("trocar folha por quadro tira nanquim e moldura e já escolhe a acrílica", () => {
    const draft = autoSelectSingleOptions(sanitizeDraft({ ...complete, sizeOptionId: "quadro" }, ctx), ctx);
    expect(draft).toMatchObject({ techniqueOptionId: "acrilica", finishOptionId: "", deliveryOptionId: "retirada" });
  });

  it("descarta obra de inspiração que não existe mais", () => {
    expect(sanitizeDraft({ ...complete, artworkRefId: "apagada" }, ctx).artworkRefId).toBeNull();
    expect(sanitizeDraft({ ...complete, artworkRefId: "obra1" }, ctx).artworkRefId).toBe("obra1");
  });

  it("grupo com uma só opção já vem escolhido", () => {
    const draft = autoSelectSingleOptions({ ...emptyDraft, modalityId: "dig" }, ctx);
    expect(draft).toMatchObject({ techniqueOptionId: "dig-tec", sizeOptionId: "a4", fileFormatOptionId: "" });
  });

  it("rascunho salvo com formato estranho não quebra o formulário", () => {
    expect(parseDraft("lixo")).toEqual(emptyDraft);
    expect(parseDraft({ name: 123, privacyAccepted: "sim", city: "Salvador" })).toMatchObject({
      name: "",
      privacyAccepted: false,
      city: "Salvador",
    });
  });
});

describe("preços de referência", () => {
  it("formata em reais, sem centavos quando redondo", () => {
    expect(formatPrice(9000)).toBe("R$ 90");
    expect(formatPrice(9050)).toBe("R$ 90,50");
    expect(formatPrice(150000)).toBe("R$ 1.500");
  });

  it("tamanho mostra o preço; moldura e entrega mostram o acréscimo", () => {
    expect(optionPriceLabel({ kind: "size", priceCents: 9000 })).toBe("R$ 90");
    expect(optionPriceLabel({ kind: "finish", priceCents: 5000 })).toBe("+ R$ 50");
    expect(optionPriceLabel({ kind: "delivery", priceCents: 0 })).toBe("sem custo");
    expect(optionPriceLabel({ kind: "delivery", priceCents: null })).toBeNull();
  });

  it("'a partir de' da modalidade é o menor tamanho com preço", () => {
    expect(startingPrice(data.options, "mao")).toBe(9000);
    expect(startingPrice(data.options, "nenhuma")).toBeNull();
  });
});
