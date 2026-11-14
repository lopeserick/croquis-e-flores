import { describe, expect, it } from "vitest";
import {
  artworkFormSchema,
  artworkSlug,
  canRemoveImage,
  hasPlaceholder,
  nextCoverAfterRemoval,
  publishProblems,
} from "@/features/admin/artwork-rules";
import { categorySlug, priceField, requiresProblem, testimonialFormSchema } from "@/features/admin/catalog-rules";
import { fieldErrors, moveInList, uniqueSlug } from "@/features/admin/forms";
import {
  fitWithin,
  galleryPath,
  isGalleryPathFor,
  parseGalleryPath,
  storedImageSchema,
} from "@/features/admin/gallery-images";
import {
  formToObject,
  getPath,
  mergeSettings,
  privacyVersion,
  setPath,
  SETTINGS_SCHEMAS,
  SETTINGS_SECTIONS,
  whatsappField,
} from "@/features/admin/settings-forms";
import { isStoredImagePath, resolveImagePath } from "@/features/catalog/image-url";
import { paragraphs } from "@/features/settings/site-settings";

const SUPABASE = "https://exemplo.supabase.co";
const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

describe("endereço das fotos", () => {
  it("foto da pasta public/ continua como está", () => {
    expect(resolveImagePath("/demo/obras/x.jpg", SUPABASE)).toBe("/demo/obras/x.jpg");
    expect(isStoredImagePath("/demo/obras/x.jpg")).toBe(false);
  });

  it("foto enviada pelo painel vira o endereço público do bucket", () => {
    expect(resolveImagePath("obras/abc/0123456789abcdef.webp", `${SUPABASE}/`)).toBe(
      `${SUPABASE}/storage/v1/object/public/obras/obras/abc/0123456789abcdef.webp`,
    );
    expect(isStoredImagePath("obras/abc/0123456789abcdef.webp")).toBe(true);
  });

  it("sem o endereço do Supabase, avisa em vez de montar um link quebrado", () => {
    expect(() => resolveImagePath("obras/x.webp", "")).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("envio de fotos do painel", () => {
  const owner = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";

  it("caminho fica na pasta do dono, com a extensão do tipo real", () => {
    const path = galleryPath("obras", owner, "image/webp", "a1b2c3d4e5f60708");
    expect(path).toBe(`obras/${owner}/a1b2c3d4e5f60708.webp`);
    expect(isGalleryPathFor("obras", owner, path)).toBe(true);
    expect(parseGalleryPath(path)).toEqual({ folder: "obras", owner });
  });

  it("recusa caminho de outro dono, outra pasta ou que tenta sair dela", () => {
    expect(isGalleryPathFor("obras", owner, `obras/outro-dono/a1b2c3d4e5f60708.webp`)).toBe(false);
    expect(isGalleryPathFor("colecoes", owner, `obras/${owner}/a1b2c3d4e5f60708.webp`)).toBe(false);
    expect(isGalleryPathFor("obras", owner, `obras/${owner}/../x/a1b2c3d4e5f60708.webp`)).toBe(false);
    expect(parseGalleryPath("referencias/x/a1b2c3d4e5f60708.png")).toBeNull();
    expect(parseGalleryPath("/demo/obras/x.jpg")).toBeNull();
  });

  it("reduz fotos grandes para 2400 px no lado maior, sem aumentar as pequenas", () => {
    expect(fitWithin(4800, 3600)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3000, 6000)).toEqual({ width: 1200, height: 2400 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("toda foto precisa de descrição (texto alternativo)", () => {
    const image = { path: "x", alt: "Retrato", width: 10, height: 10, focalX: 50, focalY: 50 };
    expect(storedImageSchema.safeParse(image).success).toBe(true);
    expect(storedImageSchema.safeParse({ ...image, alt: " " }).success).toBe(false);
    expect(storedImageSchema.safeParse({ ...image, focalX: 101 }).success).toBe(false);
  });
});

describe("apoio aos formulários", () => {
  it("troca um item de lugar com o vizinho", () => {
    expect(moveInList(["a", "b", "c"], 1, "up")).toEqual(["b", "a", "c"]);
    expect(moveInList(["a", "b", "c"], 1, "down")).toEqual(["a", "c", "b"]);
    expect(moveInList(["a", "b"], 0, "up")).toBeNull();
    expect(moveInList(["a", "b"], 1, "down")).toBeNull();
    expect(moveInList(["a"], -1, "down")).toBeNull();
  });

  it("endereço repetido ganha um número", () => {
    expect(uniqueSlug("retrato", new Set())).toBe("retrato");
    expect(uniqueSlug("retrato", new Set(["retrato", "retrato-2"]))).toBe("retrato-3");
  });

  it("erros por campo usam o nome do campo", () => {
    const result = artworkFormSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toMatchObject({ title: expect.any(String), categoryId: "Escolha a coleção." });
  });
});

describe("obras", () => {
  const valid = {
    title: "Retrato da Ana",
    slug: "",
    categoryId: uuid(1),
    modalityId: uuid(2),
    techniqueLabel: "Nanquim",
    dimensions: "",
    shortDescription: "",
    story: "",
    featured: false,
  };

  it("endereço vem do nome quando fica em branco", () => {
    expect(artworkSlug(artworkFormSchema.parse({ ...valid, title: "Coração de Mãe" }))).toBe("coracao-de-mae");
    expect(artworkSlug({ slug: "meu-endereco", title: "x" })).toBe("meu-endereco");
    expect(artworkFormSchema.safeParse({ ...valid, slug: "Com Espaço" }).success).toBe(false);
  });

  it("só publica com foto de capa descrita e sem texto provisório", () => {
    const cover = { alt: "Retrato a nanquim", isCover: true };
    expect(publishProblems(valid, [cover])).toEqual([]);
    expect(publishProblems(valid, [])).toEqual(["Envie pelo menos uma foto da obra."]);
    expect(publishProblems(valid, [{ ...cover, isCover: false }])).toEqual(["Escolha a foto de capa."]);
    expect(publishProblems({ ...valid, title: "[Nome da obra]" }, [cover])).toHaveLength(1);
    expect(hasPlaceholder("[Descrição curta]")).toBe(true);
    expect(hasPlaceholder("Retrato (2024)")).toBe(false);
  });

  it("apagar a capa promove a próxima foto; apagar outra não muda a capa", () => {
    const images = [
      { id: "b", isCover: false, sortOrder: 2 },
      { id: "a", isCover: true, sortOrder: 1 },
      { id: "c", isCover: false, sortOrder: 3 },
    ];
    expect(nextCoverAfterRemoval(images, "a")).toBe("b");
    expect(nextCoverAfterRemoval(images, "c")).toBeNull();
    expect(nextCoverAfterRemoval([{ id: "a", isCover: true, sortOrder: 1 }], "a")).toBeNull();
  });

  it("obra publicada não fica sem foto", () => {
    expect(canRemoveImage("publicada", 1)).toBe(false);
    expect(canRemoveImage("publicada", 2)).toBe(true);
    expect(canRemoveImage("rascunho", 1)).toBe(true);
  });
});

describe("catálogo e depoimentos", () => {
  it("preço em reais: vazio = sem preço; texto inválido é recusado", () => {
    expect(priceField.parse("90")).toBe(9000);
    expect(priceField.parse("1.250,50")).toBe(125050);
    expect(priceField.parse("")).toBeNull();
    expect(priceField.safeParse("noventa").success).toBe(false);
  });

  it("“só aparece com” aponta para outro grupo da mesma modalidade", () => {
    const all = [
      { id: "folha", modalityId: "m1", kind: "size" as const },
      { id: "nanquim", modalityId: "m1", kind: "technique" as const },
      { id: "lapis", modalityId: "m1", kind: "technique" as const },
      { id: "a4-digital", modalityId: "m2", kind: "size" as const },
    ];
    const nanquim = { id: "nanquim", modalityId: "m1", kind: "technique" as const };
    expect(requiresProblem(nanquim, ["folha"], all)).toBeNull();
    expect(requiresProblem(nanquim, ["lapis"], all)).toMatch(/outro grupo/);
    expect(requiresProblem(nanquim, ["a4-digital"], all)).toMatch(/mesma modalidade/);
    expect(requiresProblem(nanquim, ["nao-existe"], all)).toMatch(/mesma modalidade/);
  });

  it("coleção: endereço do nome ou o digitado", () => {
    expect(categorySlug({ slug: "", name: "Desenho técnico de moda" })).toBe("desenho-tecnico-de-moda");
    expect(categorySlug({ slug: "croquis-de-moda", name: "x" })).toBe("croquis-de-moda");
  });

  it("depoimento só é publicado com a autorização registrada", () => {
    const base = { name: "Cliente Croquis e Flores", location: "", body: "Amei o meu retrato!", rating: "5", consentNote: "", published: true };
    const refused = testimonialFormSchema.safeParse(base);
    expect(refused.success).toBe(false);
    expect(fieldErrors(refused.error!)).toHaveProperty("consentNote");
    const ok = testimonialFormSchema.parse({ ...base, consentNote: "Pesquisa de satisfação, out/2026", rating: "" });
    expect(ok.rating).toBeNull();
    expect(testimonialFormSchema.safeParse({ ...base, published: false }).success).toBe(true);
  });
});

describe("textos e configurações", () => {
  it("campos com caminho viram objeto; números viram lista; campos de controle saem", () => {
    const data = new FormData();
    data.set("section", "passos");
    data.set("$ACTION_ID_x", "");
    data.set("howItWorks.subtitle", "Em até 15 dias");
    data.set("howItWorks.steps.1.title", "Segundo");
    data.set("howItWorks.steps.0.title", "Primeiro");
    data.set("hero.image", "{}");
    expect(formToObject(data, ["hero.image"])).toEqual({
      howItWorks: { subtitle: "Em até 15 dias", steps: [{ title: "Primeiro" }, { title: "Segundo" }] },
    });
  });

  it("junta a mudança com o valor atual (listas trocadas inteiras)", () => {
    const current = { hero: { title: "A", highlights: ["x", "y"] }, editorialExample: null };
    expect(mergeSettings(current, { hero: { highlights: ["z"] } })).toEqual({
      hero: { title: "A", highlights: ["z"] },
      editorialExample: null,
    });
    const target: Record<string, unknown> = {};
    setPath(target, "hero.image", 1);
    expect(getPath(target, "hero.image")).toBe(1);
  });

  it("WhatsApp: aceita com máscara, guarda com 55; vazio tira o botão", () => {
    expect(whatsappField.parse("(75) 98849-8356")).toBe("5575988498356");
    expect(whatsappField.parse("+55 75 98849-8356")).toBe("5575988498356");
    expect(whatsappField.parse("")).toBeNull();
    expect(whatsappField.safeParse("75 3221").success).toBe(false);
  });

  it("formulário de encomenda: caixa desmarcada = não; números fora do limite são recusados", () => {
    const patch = SETTINGS_SECTIONS.formulario.patch;
    expect(patch.parse({ minLeadDays: "15", maxFiles: "10", maxFileSizeMb: "10" })).toEqual({
      minLeadDays: 15,
      maxFiles: 10,
      maxFileSizeMb: 10,
      askPortfolioConsent: false,
    });
    expect(patch.safeParse({ minLeadDays: "-1", maxFiles: "10", maxFileSizeMb: "10" }).success).toBe(false);
    expect(patch.safeParse({ minLeadDays: "15", maxFiles: "30", maxFileSizeMb: "10" }).success).toBe(false);
  });

  it("como funciona: pelo menos 1 e no máximo 8 passos, todos preenchidos", () => {
    const patch = SETTINGS_SECTIONS.passos.patch;
    const step = { title: "Conversa", text: "Você me conta a ideia." };
    expect(patch.safeParse({ howItWorks: { subtitle: "", steps: [step] } }).success).toBe(true);
    expect(patch.safeParse({ howItWorks: { subtitle: "", steps: [] } }).success).toBe(false);
    expect(patch.safeParse({ howItWorks: { subtitle: "", steps: [{ title: "", text: "x" }] } }).success).toBe(false);
    expect(patch.safeParse({ howItWorks: { subtitle: "", steps: Array(9).fill(step) } }).success).toBe(false);
  });

  it("itens do destaque: uma frase por linha, linhas vazias saem", () => {
    const parsed = SETTINGS_SECTIONS.destaque.patch.parse({
      hero: { eyebrow: "", title: "Transforme", titleEmphasis: "", description: "", highlights: "Feito à mão\n\n Exclusivo \n", imageCaption: "" },
    });
    expect(parsed.hero.highlights).toEqual(["Feito à mão", "Exclusivo"]);
  });

  it("a mudança só é gravada se o site continuar conseguindo ler", () => {
    const site = {
      siteName: "Croquis e Flores",
      topBarMessage: "Obras exclusivas",
      footerDescription: "",
      instagramHandle: "croquiseflores",
      whatsappNumber: "5575988498356",
      contactEmail: "contato@exemplo.com",
    };
    const contact = SETTINGS_SECTIONS.contato.patch.parse({
      whatsappNumber: "(71) 99876-5432",
      contactEmail: "",
      instagramHandle: "@croquiseflores",
    });
    const merged = SETTINGS_SCHEMAS.site.parse(mergeSettings(site, contact));
    expect(merged).toMatchObject({ whatsappNumber: "5571998765432", contactEmail: null, instagramHandle: "croquiseflores" });
  });

  it("versão da política: data e hora de São Paulo", () => {
    expect(privacyVersion(new Date("2026-11-13T02:30:00Z"))).toBe("2026-11-12-2330");
  });

  it("texto legal em parágrafos (linha em branco separa)", () => {
    expect(paragraphs("Primeiro.\nainda o primeiro.\n\n  \nSegundo.")).toEqual(["Primeiro.\nainda o primeiro.", "Segundo."]);
    expect(paragraphs("   ")).toEqual([]);
  });
});
