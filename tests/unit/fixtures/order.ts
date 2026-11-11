import type { OptionRow } from "@/features/catalog/types";
import { type OrderFormData } from "@/features/orders/form-types";
import { emptyDraft, type OrderDraft, type ValidationContext } from "@/features/orders/schema";

// Catálogo pequeno para testar as regras do pedido: obra feita à mão (folha
// ou quadro, com dependências) e ilustração digital.

export const image = { path: "/x.jpg", alt: "x", width: 1, height: 1, focalX: 50, focalY: 50 };

export const data: ValidationContext["data"] = {
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

export const ctx: ValidationContext = { data, today: "2026-11-10" };

export const complete: OrderDraft = {
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
