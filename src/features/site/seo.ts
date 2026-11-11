import type { Metadata } from "next";
import type { ImageAsset } from "@/features/catalog/types";

// Metadados das páginas: título, descrição, endereço canônico e a prévia que
// aparece quando o link é colado no WhatsApp ou no Instagram (Open Graph).

export const SITE_NAME = "Croquis e Flores";

type PageMetadataInput = {
  title: string;
  description: string;
  /** Caminho canônico, sem filtros (ex.: "/galeria"). */
  path: string;
  /** Foto da prévia. Sem ela, vale a imagem padrão do site (opengraph-image). */
  image?: ImageAsset;
};

export function pageMetadata({ title, description, path, image }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: path,
      ...(image && {
        images: [{ url: image.path, width: image.width, height: image.height, alt: image.alt }],
      }),
    },
  };
}
