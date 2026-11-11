// Formato usado pelas telas. As linhas do Supabase são convertidas para estes
// tipos em mappers.ts (tabelas: supabase/migrations).

export type DeliveryKind = "digital" | "fisica";

export type ModalityRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Imagem demonstrativa, mostrada no configurador e em "Tipos de obra". */
  image: ImageAsset | null;
  deliveryKind: DeliveryKind;
  sortOrder: number;
  active: boolean;
};

export type OptionKind = "technique" | "size" | "finish" | "file_format";

/** Técnica, tamanho, acabamento ou formato de arquivo oferecido numa modalidade. */
export type OptionRow = {
  id: string;
  modalityId: string;
  kind: OptionKind;
  label: string;
  description: string;
  /** Abre campo livre ("Outra técnica", "Tamanho personalizado"). */
  allowsCustom: boolean;
  sortOrder: number;
};

/** Categoria disponível como "tipo de arte" numa modalidade. */
export type CategoryModalityRow = { categoryId: string; modalityId: string };

/** Foto com dimensões reais e ponto focal (0–100, em %) para os cortes. */
export type ImageAsset = {
  path: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: ImageAsset;
  sortOrder: number;
  active: boolean;
  showOnHome: boolean;
};

export type ArtworkStatus = "rascunho" | "publicada" | "arquivada";

export type ArtworkRow = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  story: string;
  dimensions: string;
  categoryId: string;
  modalityId: string;
  techniqueLabel: string;
  featured: boolean;
  sortOrder: number;
  status: ArtworkStatus;
};

export type ArtworkImageRow = ImageAsset & {
  id: string;
  artworkId: string;
  sortOrder: number;
  isCover: boolean;
};

/** Obra pronta para exibir em card: já com categoria, modalidade e capa. */
export type ArtworkSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: Pick<CategoryRow, "id" | "slug" | "name">;
  modality: Pick<ModalityRow, "id" | "slug" | "name" | "deliveryKind">;
  techniqueLabel: string;
  cover: ImageAsset;
};

/** Página da obra: o card mais a história, as dimensões e todas as fotos (capa primeiro). */
export type ArtworkDetail = ArtworkSummary & {
  story: string;
  dimensions: string;
  images: ImageAsset[];
};
