import { describe, expect, it } from "vitest";
import {
  getActiveModalities,
  getArtworkBySlug,
  getFeaturedArtworks,
  getHomeCategories,
} from "@/features/catalog/queries";
import { getSiteSettings } from "@/features/settings/site-settings";
import { getPublishedTestimonials } from "@/features/testimonials/testimonials";

// O site lendo o banco (seed provisório) mostra o mesmo que a entrega 2.

describe("dados provisórios lidos do Supabase", () => {
  it("a home mostra as 4 coleções do protótipo, em ordem", async () => {
    const names = (await getHomeCategories()).map((c) => c.name);
    expect(names).toEqual(["Croquis de moda", "Retratos", "Casais", "Momentos especiais"]);
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
    expect(settings.about.heading).toBe("Oi, eu sou a Carla.");
  });

  it("depoimentos do seed são todos de exemplo", async () => {
    const list = await getPublishedTestimonials();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((t) => t.demo)).toBe(true);
  });
});
