import type { Metadata } from "next";
import Image from "next/image";
import { focalPosition } from "@/components/site/artwork-card";
import { PageIntro } from "@/components/site/page-intro";
import { ActionLink, ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import { galleryHref } from "@/features/catalog/gallery-filters";
import { getActiveModalities, getPublishedArtworks } from "@/features/catalog/queries";
import { pageMetadata } from "@/features/site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tipos de obra",
  description: "Obra feita à mão, ilustração digital ou ilustração impressa: escolha como quer receber a sua.",
  path: "/tipos-de-obra",
});

const deliveryLabel = {
  fisica: "Entrega física",
  digital: "Entrega em arquivo digital",
} as const;

export default async function ArtTypesPage() {
  const [modalities, artworks] = await Promise.all([getActiveModalities(), getPublishedArtworks()]);
  return (
    <>
      <PageIntro eyebrow="Modalidades" title="Tipos de obra">
        <p>Escolha como quer receber a sua: feita à mão, em arquivo digital ou impressa.</p>
      </PageIntro>
      <Container className="py-14 md:py-18">
        <ul className="grid gap-6 md:grid-cols-3">
          {modalities.map((modality) => {
            const hasArtworks = artworks.some((a) => a.modality.slug === modality.slug);
            return (
              <li
                key={modality.id}
                className="flex flex-col overflow-hidden rounded-card border border-border bg-white"
              >
                {modality.image && (
                  <div className="relative aspect-[4/3] bg-blush">
                    <Image
                      src={modality.image.path}
                      alt={modality.image.alt}
                      fill
                      sizes="(min-width: 768px) 30vw, 92vw"
                      className="object-cover"
                      style={{ objectPosition: focalPosition(modality.image) }}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-7">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-rose">
                    {deliveryLabel[modality.deliveryKind]}
                  </p>
                  <h2 className="font-serif text-[28px] leading-tight font-medium">{modality.name}</h2>
                  <p className="leading-relaxed text-plum-muted">{modality.description}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                    <ButtonLink href={`/encomendar?modalidade=${modality.slug}`} size="sm">
                      Encomendar
                    </ButtonLink>
                    {hasArtworks && (
                      <ActionLink href={galleryHref(null, { modalidade: modality.slug })}>
                        Ver obras<span className="sr-only">: {modality.name}</span>
                      </ActionLink>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
