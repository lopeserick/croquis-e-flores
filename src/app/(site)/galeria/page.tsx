import type { Metadata } from "next";
import { Suspense } from "react";
import { GallerySkeleton, GalleryView } from "@/components/gallery/gallery-view";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";
import { pageMetadata } from "@/features/site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Galeria",
  description:
    "Croquis de moda, retratos e ilustrações criados pela artista Carla. Filtre por coleção, modalidade e técnica e encomende a sua.",
  path: "/galeria",
});

export default function GalleryPage(props: PageProps<"/galeria">) {
  return (
    <>
      <PageIntro eyebrow="Portfólio" title="Galeria">
        <p>Obras já criadas pela artista. Inspire-se e encomende a sua.</p>
      </PageIntro>
      <Container className="py-12 md:py-16">
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryView searchParams={props.searchParams} categorySlug={null} />
        </Suspense>
      </Container>
    </>
  );
}
