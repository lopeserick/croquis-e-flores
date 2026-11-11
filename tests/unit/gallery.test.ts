import { describe, expect, it } from "vitest";
import {
  facetOptions,
  filterArtworks,
  galleryHref,
  hasActiveFilters,
  parseGalleryFilters,
  techniqueFacet,
} from "@/features/catalog/gallery-filters";
import { pickRelatedArtworks } from "@/features/catalog/queries";
import type { ArtworkSummary } from "@/features/catalog/types";
import { normalizeText, slugify } from "@/lib/text";

const art = (
  id: string,
  category: string,
  modality: string,
  technique: string,
  title = `Obra ${id}`,
): ArtworkSummary => ({
  id,
  slug: id,
  title,
  shortDescription: "",
  category: { id: category, slug: category, name: category === "retratos" ? "Retratos" : "Croquis de moda" },
  modality: {
    id: modality,
    slug: modality,
    name: modality === "ilustracao-digital" ? "Ilustração digital" : "Obra feita à mão",
    deliveryKind: modality === "ilustracao-digital" ? "digital" : "fisica",
  },
  techniqueLabel: technique,
  cover: { path: "/x.jpg", alt: "x", width: 1, height: 1, focalX: 50, focalY: 50 },
});

const artworks = [
  art("a", "croquis-de-moda", "obra-feita-a-mao", "Nanquim", "Croqui com chapéu"),
  art("b", "retratos", "ilustracao-digital", "Ilustração digital", "Retrato do cantor"),
  art("c", "croquis-de-moda", "obra-feita-a-mao", "Técnica mista"),
  art("d", "croquis-de-moda", "ilustracao-digital", "Ilustração digital"),
];

const none = { q: "", modalidade: null, tecnica: null };

describe("texto", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeText("  Técnica MISTA ")).toBe("tecnica mista");
  });

  it("gera slug para endereço", () => {
    expect(slugify("Técnica mista")).toBe("tecnica-mista");
    expect(slugify("20 × 30 cm")).toBe("20-30-cm");
  });
});

describe("parseGalleryFilters", () => {
  it("lê busca, modalidade e técnica do endereço", () => {
    expect(parseGalleryFilters({ q: "  retrato  azul ", modalidade: "obra-feita-a-mao", tecnica: "nanquim" })).toEqual(
      { q: "retrato azul", modalidade: "obra-feita-a-mao", tecnica: "nanquim" },
    );
  });

  it("ignora valores inválidos e repetidos", () => {
    const filters = parseGalleryFilters({ modalidade: "<script>", tecnica: ["nanquim", "lapis"] });
    expect(filters).toEqual({ q: "", modalidade: null, tecnica: "nanquim" });
  });

  it("limita o tamanho da busca", () => {
    expect(parseGalleryFilters({ q: "a".repeat(500) }).q).toHaveLength(80);
  });

  it("sabe quando há filtro ativo", () => {
    expect(hasActiveFilters(none)).toBe(false);
    expect(hasActiveFilters({ ...none, q: "x" })).toBe(true);
  });
});

describe("filterArtworks", () => {
  const ids = (list: ArtworkSummary[]) => list.map((a) => a.id);

  it("sem filtros, devolve tudo", () => {
    expect(ids(filterArtworks(artworks, none))).toEqual(["a", "b", "c", "d"]);
  });

  it("filtra por coleção, modalidade e técnica ao mesmo tempo", () => {
    expect(ids(filterArtworks(artworks, none, "croquis-de-moda"))).toEqual(["a", "c", "d"]);
    expect(ids(filterArtworks(artworks, { ...none, modalidade: "ilustracao-digital" }, "croquis-de-moda"))).toEqual([
      "d",
    ]);
    expect(ids(filterArtworks(artworks, { ...none, tecnica: "tecnica-mista" }))).toEqual(["c"]);
  });

  it("busca sem acento encontra texto com acento, em título, coleção ou técnica", () => {
    expect(ids(filterArtworks(artworks, { ...none, q: "chapeu" }))).toEqual(["a"]);
    expect(ids(filterArtworks(artworks, { ...none, q: "CROQUI" }))).toEqual(["a", "c", "d"]);
    expect(ids(filterArtworks(artworks, { ...none, q: "tecnica" }))).toEqual(["c"]);
  });

  it("todas as palavras da busca precisam aparecer", () => {
    expect(ids(filterArtworks(artworks, { ...none, q: "retrato digital" }))).toEqual(["b"]);
    expect(ids(filterArtworks(artworks, { ...none, q: "retrato nanquim" }))).toEqual([]);
  });
});

describe("opções dos filtros", () => {
  it("só lista técnicas que existem, sem repetir", () => {
    expect(facetOptions(artworks, techniqueFacet)).toEqual([
      { slug: "nanquim", label: "Nanquim" },
      { slug: "ilustracao-digital", label: "Ilustração digital" },
      { slug: "tecnica-mista", label: "Técnica mista" },
    ]);
  });

  it("monta endereço compartilhável, sem parâmetros vazios", () => {
    expect(galleryHref(null, none)).toBe("/galeria");
    expect(galleryHref("retratos", { q: "casal feliz", modalidade: "ilustracao-digital", tecnica: null })).toBe(
      "/galeria/retratos?q=casal+feliz&modalidade=ilustracao-digital",
    );
  });
});

describe("pickRelatedArtworks", () => {
  it("mostra primeiro a mesma coleção, sem repetir a obra atual", () => {
    expect(pickRelatedArtworks(artworks[0], artworks, 3).map((a) => a.id)).toEqual(["c", "d", "b"]);
  });
});
