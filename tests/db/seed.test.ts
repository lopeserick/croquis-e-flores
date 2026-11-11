import { describe, expect, it } from "vitest";
import {
  getActiveModalities,
  getArtworkBySlug,
  getFeaturedArtworks,
  getHomeCategories,
} from "@/features/catalog/queries";
import { getOrderFormData } from "@/features/orders/form-data";
import { getSiteSettings } from "@/features/settings/site-settings";
import { getPublishedTestimonials } from "@/features/testimonials/testimonials";

// O site lendo o banco (supabase/seed.sql): conteúdo real da Carla
// (docs/conteudo-carla.md) com as fotos provisórias do protótipo.

describe("dados iniciais lidos do Supabase", () => {
  it("a home mostra as 5 coleções da Carla, em ordem", async () => {
    const categories = await getHomeCategories();
    expect(categories.map((c) => c.name)).toEqual([
      "Retratos",
      "Casais",
      "Pets",
      "Desenho técnico de moda",
      "Kit para colorir",
    ]);
    expect(categories.find((c) => c.slug === "kit-para-colorir")?.priceCents).toBe(5500);
  });

  it("obra feita à mão: preços dos tamanhos e técnica conforme o suporte", async () => {
    const { options, modalities } = await getOrderFormData();
    const mao = modalities.find((m) => m.slug === "obra-feita-a-mao")!;
    const ofMao = options.filter((o) => o.modalityId === mao.id);
    const byLabel = (label: string) => ofMao.find((o) => o.label === label)!;
    expect(ofMao.filter((o) => o.kind === "size").map((o) => [o.label, o.priceCents])).toEqual([
      ["Quadro 10 × 15 cm", 9000],
      ["Quadro 16 × 22 cm", 12000],
      ["Quadro 20 × 25 cm", 14000],
      ["Folha A4", 10000],
    ]);
    expect(byLabel("Tinta acrílica").requiresOptionIds).not.toContain(byLabel("Folha A4").id);
    expect(byLabel("Nanquim").requiresOptionIds).toEqual([byLabel("Folha A4").id]);
    expect(byLabel("Com moldura (porta-retrato)").priceCents).toBe(5000);
    expect(ofMao.filter((o) => o.kind === "delivery")).toHaveLength(3);
  });

  it("ilustração digital: arquivo em PDF ou JPG", async () => {
    const { options, modalities } = await getOrderFormData();
    const dig = modalities.find((m) => m.slug === "ilustracao-digital")!;
    const formats = options.filter((o) => o.modalityId === dig.id && o.kind === "file_format").map((o) => o.label);
    expect(formats).toEqual(["PDF", "JPG"]);
  });

  it("calendário começa 15 dias à frente", async () => {
    expect((await getOrderFormData()).settings.minLeadDays).toBe(15);
  });

  it("as 3 modalidades aparecem em ordem", async () => {
    const names = (await getActiveModalities()).map((m) => m.name);
    expect(names).toEqual(["Obra feita à mão", "Ilustração digital", "Ilustração digital impressa"]);
  });

  it("toda obra em destaque tem foto com texto alternativo", async () => {
    const featured = await getFeaturedArtworks();
    expect(featured.length).toBeGreaterThan(4); // mais que uma tela: as setas têm função
    for (const a of featured) expect(a.cover.alt.trim()).not.toBe("");
  });

  it("nomes de obras pendentes vêm entre colchetes", async () => {
    for (const a of await getFeaturedArtworks()) expect(a.title).toMatch(/^\[.+\]$/);
  });

  it("obra é encontrada pelo endereço", async () => {
    const artwork = await getArtworkBySlug("croqui-chapeu");
    expect(artwork?.category.slug).toBe("croquis-de-moda");
    expect(await getArtworkBySlug("nao-existe")).toBeNull();
  });

  it("configurações têm os contatos do ateliê", async () => {
    const settings = await getSiteSettings();
    expect(settings.whatsappNumber).toBe("5575988498356");
    expect(settings.contactEmail).toBe("croquiseflores@outlook.com");
    expect(settings.about.intro).toMatch(/^Sou Carla Vitória/);
    expect(settings.howItWorks.steps).toHaveLength(5);
  });

  it("depoimentos reais, sem nome, e nenhum de exemplo", async () => {
    const list = await getPublishedTestimonials();
    expect(list).toHaveLength(7);
    expect(list.every((t) => !t.demo && t.name === "Cliente Croquis e Flores")).toBe(true);
  });
});
