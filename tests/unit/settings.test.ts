import { describe, expect, it } from "vitest";
import { parseSiteSettings } from "@/features/settings/site-settings";

const photo = { path: "/p.jpg", alt: "Foto", width: 10, height: 10, focalX: 50, focalY: 50 };

const rows = [
  {
    key: "site",
    value: {
      siteName: "Croquis e Flores",
      topBarMessage: "Faixa",
      footerDescription: "Rodapé",
      instagramHandle: "croquiseflores",
      whatsappNumber: "5575988498356",
      contactEmail: "contato@exemplo.com",
    },
  },
  {
    key: "home",
    value: {
      hero: {
        eyebrow: "",
        title: "Título",
        titleEmphasis: "arte.",
        description: "",
        highlights: [],
        image: photo,
        imageCaption: "",
      },
      editorialExample: null,
    },
  },
  {
    key: "about",
    value: {
      heading: "Oi",
      signature: "",
      intro: "",
      story: "",
      process: "",
      differentials: "",
      photo,
    },
  },
];

const withSite = (site: Record<string, unknown>) =>
  rows.map((row) => (row.key === "site" ? { ...row, value: { ...row.value, ...site } } : row));

describe("parseSiteSettings", () => {
  it("junta as chaves site, home e about", () => {
    const settings = parseSiteSettings(rows);
    expect(settings.siteName).toBe("Croquis e Flores");
    expect(settings.hero.title).toBe("Título");
    expect(settings.about.heading).toBe("Oi");
  });

  it("aceita contatos ainda não informados (null)", () => {
    const settings = parseSiteSettings(withSite({ whatsappNumber: null, contactEmail: null }));
    expect(settings.whatsappNumber).toBeNull();
  });

  it("rejeita WhatsApp sem DDI 55 ou com caracteres além de dígitos", () => {
    expect(() => parseSiteSettings(withSite({ whatsappNumber: "75988498356" }))).toThrow(/site/);
    expect(() => parseSiteSettings(withSite({ whatsappNumber: "+55 75 98849-8356" }))).toThrow(/site/);
  });

  it("diz quais chaves faltam no banco", () => {
    expect(() => parseSiteSettings(rows.filter((r) => r.key !== "about"))).toThrow(/about/);
  });
});
