import { describe, expect, it } from "vitest";
import { footerNav, isActiveHref, mainNav } from "@/features/site/navigation";

describe("isActiveHref", () => {
  it("marca Início só na página inicial", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/galeria", "/")).toBe(false);
  });

  it("marca a seção também nas subpáginas", () => {
    expect(isActiveHref("/galeria", "/galeria")).toBe(true);
    expect(isActiveHref("/galeria/retratos", "/galeria")).toBe(true);
  });

  it("não confunde rotas com o mesmo começo", () => {
    expect(isActiveHref("/galerias", "/galeria")).toBe(false);
  });

  it("nunca marca âncoras como página atual", () => {
    expect(isActiveHref("/", "/#como-funciona")).toBe(false);
  });
});

describe("menus", () => {
  it("segue a ordem do briefing, com 'Tipos de obra' no lugar de 'Tipos de pintura'", () => {
    expect(mainNav.map((i) => i.label)).toEqual([
      "Início",
      "Galeria",
      "Tipos de obra",
      "Como funciona",
      "Sobre a artista",
      "Contato",
    ]);
  });

  it("o rodapé repete só a navegação de conteúdo", () => {
    expect(footerNav.map((i) => i.href)).toEqual(["/galeria", "/tipos-de-obra", "/#como-funciona", "/sobre"]);
  });
});
