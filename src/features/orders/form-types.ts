import { z } from "zod";
import type { DeliveryKind, ImageAsset, OptionRow } from "@/features/catalog/types";

// Dados que o configurador recebe do servidor. Sem nada privado: vão para o navegador.

/** Limites do formulário (configuração "order_form", editável no painel). */
export const orderFormSettingsSchema = z.object({
  maxFiles: z.int().min(0).max(20),
  maxFileSizeMb: z.number().positive().max(10),
  /** Data desejada a partir de hoje + N dias. */
  minLeadDays: z.int().min(0).max(365),
  askPortfolioConsent: z.boolean(),
  privacyPolicyVersion: z.string().min(1),
});

export type OrderFormSettings = z.infer<typeof orderFormSettingsSchema>;

export type OrderFormModality = {
  id: string;
  slug: string;
  name: string;
  description: string;
  deliveryKind: DeliveryKind;
  image: ImageAsset | null;
};

export type OrderFormCategory = {
  id: string;
  slug: string;
  name: string;
  image: ImageAsset;
  /** Modalidades em que aparece como "tipo de arte". */
  modalityIds: string[];
};

/** Obra da galeria que pode servir de inspiração ("Criar uma obra inspirada nesta"). */
export type OrderFormArtwork = {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  modalityId: string;
  cover: ImageAsset;
};

export type OrderFormData = {
  modalities: OrderFormModality[];
  categories: OrderFormCategory[];
  options: OptionRow[];
  artworks: OrderFormArtwork[];
  settings: OrderFormSettings;
};

/** Valor do "tipo de arte" quando o pedido não se encaixa numa coleção. */
export const CUSTOM_CATEGORY = "personalizado";
