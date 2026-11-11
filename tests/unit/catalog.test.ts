import { describe, expect, it } from "vitest";
import { parseImageAsset, toArtworkImage, toCategory } from "@/features/catalog/mappers";
import { buildArtworkSummaries } from "@/features/catalog/queries";
import type { ArtworkImageRow, ArtworkRow, CategoryRow, ModalityRow } from "@/features/catalog/types";

const image = { path: "/x.jpg", alt: "Foto", width: 100, height: 125, focalX: 50, focalY: 50 };

const category: CategoryRow = {
  id: "c1",
  slug: "retratos",
  name: "Retratos",
  tagline: "",
  image,
  sortOrder: 1,
  active: true,
  showOnHome: true,
};

const modality: ModalityRow = {
  id: "m1",
  slug: "ilustracao-digital",
  name: "Ilustração digital",
  description: "",
  image: null,
  deliveryKind: "digital",
  sortOrder: 1,
  active: true,
};

const artwork = (id: string, overrides: Partial<ArtworkRow> = {}): ArtworkRow => ({
  id,
  slug: id,
  title: `Obra ${id}`,
  shortDescription: "",
  story: "",
  dimensions: "",
  categoryId: "c1",
  modalityId: "m1",
  techniqueLabel: "Ilustração digital",
  featured: true,
  sortOrder: 1,
  status: "publicada",
  ...overrides,
});

const cover = (artworkId: string): ArtworkImageRow => ({
  ...image,
  id: `img-${artworkId}`,
  artworkId,
  sortOrder: 1,
  isCover: true,
});

describe("buildArtworkSummaries", () => {
  const sources = { categories: [category], modalities: [modality], images: [cover("a")] };

  it("junta categoria, modalidade e capa", () => {
    const [summary] = buildArtworkSummaries([artwork("a")], sources);
    expect(summary.category).toEqual({ id: "c1", slug: "retratos", name: "Retratos" });
    expect(summary.modality.name).toBe("Ilustração digital");
    expect(summary.cover.path).toBe("/x.jpg");
  });

  it("deixa de fora obra sem foto de capa", () => {
    expect(buildArtworkSummaries([artwork("sem-foto")], sources)).toEqual([]);
  });

  it("deixa de fora obra com categoria ou modalidade inexistente", () => {
    expect(buildArtworkSummaries([artwork("a", { categoryId: "x" })], sources)).toEqual([]);
    expect(buildArtworkSummaries([artwork("a", { modalityId: "x" })], sources)).toEqual([]);
  });
});

describe("conversão das linhas do banco", () => {
  const categoryRow = {
    id: "c1",
    slug: "retratos",
    name: "Retratos",
    tagline: "Momentos",
    image: { path: "/x.jpg", alt: "Foto", width: 100, height: 125, focalX: 50, focalY: 20 },
    sort_order: 2,
    active: true,
    show_on_home: false,
    created_at: "",
    updated_at: "",
  };

  it("categoria: snake_case vira camelCase e a foto é validada", () => {
    expect(toCategory(categoryRow)).toEqual({
      id: "c1",
      slug: "retratos",
      name: "Retratos",
      tagline: "Momentos",
      image: { path: "/x.jpg", alt: "Foto", width: 100, height: 125, focalX: 50, focalY: 20 },
      sortOrder: 2,
      active: true,
      showOnHome: false,
    });
  });

  it("categoria com foto sem texto alternativo é rejeitada", () => {
    expect(() => toCategory({ ...categoryRow, image: { ...categoryRow.image, alt: " " } })).toThrow(
      /categoria "retratos"/,
    );
  });

  it("foto com ponto focal fora de 0–100 é rejeitada", () => {
    expect(() => parseImageAsset({ ...categoryRow.image, focalX: 120 }, "teste")).toThrow();
  });

  it("foto de obra mantém ponto focal e capa", () => {
    const image = toArtworkImage({
      id: "i1",
      artwork_id: "a1",
      path: "/y.jpg",
      alt: "Obra",
      width: 10,
      height: 20,
      focal_x: 30,
      focal_y: 70,
      sort_order: 1,
      is_cover: true,
      created_at: "",
    });
    expect(image).toMatchObject({ artworkId: "a1", focalX: 30, focalY: 70, isCover: true });
  });
});
