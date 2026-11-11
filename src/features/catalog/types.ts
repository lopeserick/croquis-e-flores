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

export type OptionKind = "technique" | "size" | "finish" | "file_format" | "delivery";

/** Técnica, tamanho, acabamento, formato de arquivo ou forma de entrega oferecido numa modalidade. */
export type OptionRow = {
  id: string;
  modalityId: string;
  kind: OptionKind;
  label: string;
  description: string;
  /** Abre campo livre ("Outra técnica", "Tamanho personalizado"). */
  allowsCustom: boolean;
  /** Tamanho: preço "a partir de". Moldura e entrega: acréscimo (0 = sem custo). null = sem preço. */
  priceCents: number | null;
  /** Só aparece quando uma destas opções (de outro grupo) está escolhida. Vazio = sempre. */
  requiresOptionIds: string[];
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
  /** null = coleção ainda sem foto (o site mostra o símbolo da marca). */
  image: ImageAsset | null;
  /** Preço "a partir de" próprio da coleção (ex.: Desenho técnico de moda). */
  priceCents: number | null;
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
