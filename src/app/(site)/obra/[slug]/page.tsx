import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { focalPosition } from "@/components/site/artwork-card";
import { ArtworkGrid } from "@/components/site/artwork-grid";
import { ActionLink, ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, SectionTitle } from "@/components/ui/layout";
import {
  getArtworkDetail,
  getPublishedArtworks,
  pickRelatedArtworks,
} from "@/features/catalog/queries";
import type { ArtworkDetail } from "@/features/catalog/types";
import { pageMetadata, SITE_NAME } from "@/features/site/seo";
import { getEnv } from "@/lib/env";

export async function generateStaticParams() {
  const artworks = await getPublishedArtworks();
  return artworks.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/obra/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const artwork = await getArtworkDetail(slug);
  if (!artwork) return { title: "Obra" };
  return pageMetadata({
    title: artwork.title,
    description: artwork.shortDescription || `${artwork.category.name} · ${artwork.techniqueLabel}`,
    path: `/obra/${artwork.slug}`,
    image: artwork.cover,
  });
}

// O endereço é lido dentro de Suspense: cabeçalho e rodapé aparecem na hora
// ao navegar, e a obra entra em seguida.
export default function ArtworkPage(props: PageProps<"/obra/[slug]">) {
  return (
    <Suspense fallback={<ArtworkSkeleton />}>
      <ArtworkContent params={props.params} />
    </Suspense>
  );
}

function ArtworkSkeleton() {
  return (
    <Container aria-busy="true" className="py-8 md:py-14">
      <p className="sr-only" role="status">
        Carregando a obra…
      </p>
      <div className="mt-[72px] grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="aspect-square animate-pulse rounded-card bg-blush motion-reduce:animate-none" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-40 rounded-full bg-blush" />
          <div className="h-10 w-4/5 rounded-full bg-blush" />
          <div className="h-4 w-full rounded-full bg-blush" />
          <div className="h-40 rounded-card bg-blush" />
        </div>
      </div>
    </Container>
  );
}

async function ArtworkContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artwork = await getArtworkDetail(slug);
  if (!artwork) notFound();

  const related = pickRelatedArtworks(artwork, await getPublishedArtworks());
  const [cover, ...moreImages] = artwork.images;
  const orderHref = `/encomendar?obra=${encodeURIComponent(artwork.slug)}`;

  return (
    <>
      <ArtworkJsonLd artwork={artwork} />
      <Container className="py-8 md:py-14">
        <nav aria-label="Você está em" className="mb-7 text-sm text-plum-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/galeria" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Galeria
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/galeria/${artwork.category.slug}`}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                {artwork.category.name}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-card bg-blush">
              <Image
                src={cover.path}
                alt={cover.alt}
                width={cover.width}
                height={cover.height}
                sizes="(min-width: 1280px) 700px, (min-width: 1024px) 56vw, 100vw"
                preload
                className="mx-auto h-auto max-h-[80svh] w-auto object-contain"
              />
            </div>
            {moreImages.length > 0 && (
              <ul className="grid grid-cols-2 gap-4" aria-label="Mais fotos da obra">
                {moreImages.map((image) => (
                  <li key={image.path} className="relative aspect-square overflow-hidden rounded-card bg-blush">
                    <Image
                      src={image.path}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 28vw, 50vw"
                      className="object-cover"
                      style={{ objectPosition: focalPosition(image) }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-6 self-start lg:sticky lg:top-8">
            <div className="flex flex-col gap-3">
              <Eyebrow>
                {artwork.category.name} · {artwork.techniqueLabel}
              </Eyebrow>
              <h1 className="font-serif text-section font-normal md:text-section-lg">{artwork.title}</h1>
              {artwork.shortDescription && (
                <p className="text-[17px] leading-[1.7] text-plum-soft">{artwork.shortDescription}</p>
              )}
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-border py-5 text-[15px]">
              <dt className="text-plum-muted">Modalidade</dt>
              <dd>{artwork.modality.name}</dd>
              <dt className="text-plum-muted">Técnica</dt>
              <dd>{artwork.techniqueLabel}</dd>
              <dt className="text-plum-muted">Coleção</dt>
              <dd>{artwork.category.name}</dd>
              {artwork.dimensions && (
                <>
                  <dt className="text-plum-muted">Dimensões</dt>
                  <dd>{artwork.dimensions}</dd>
                </>
              )}
            </dl>

            <div className="flex flex-col gap-4 rounded-card bg-peach-soft p-6">
              <p className="font-serif text-2xl leading-snug">Gostou? A artista cria uma obra só sua.</p>
              <p className="text-[15px] leading-relaxed text-plum-soft">
                Você escolhe a modalidade e o tamanho, envia suas fotos de referência e recebe um orçamento.
              </p>
              <ButtonLink href={orderHref} wrap className="self-start">
                Criar uma obra inspirada nesta
              </ButtonLink>
            </div>
            <ActionLink href={`/galeria/${artwork.category.slug}`}>Ver mais de {artwork.category.name}</ActionLink>
          </div>
        </div>

        {artwork.story && (
          <section aria-labelledby="historia-titulo" className="mt-14 max-w-3xl md:mt-20">
            <SectionTitle id="historia-titulo">A história desta obra</SectionTitle>
            <p className="mt-5 text-[17px] leading-[1.8] whitespace-pre-line text-plum-soft">{artwork.story}</p>
          </section>
        )}
      </Container>

      {related.length > 0 && (
        <section aria-labelledby="mais-obras-titulo" className="bg-white py-14 md:py-20">
          <Container className="flex flex-col gap-10">
            <SectionTitle id="mais-obras-titulo">Mais obras</SectionTitle>
            <ArtworkGrid artworks={related} headingLevel="h3" />
          </Container>
        </section>
      )}
    </>
  );
}

/** Dados estruturados para buscadores (schema.org/VisualArtwork). */
function ArtworkJsonLd({ artwork }: { artwork: ArtworkDetail }) {
  const site = getEnv("site").NEXT_PUBLIC_SITE_URL;
  const data = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    description: artwork.shortDescription || undefined,
    image: artwork.images.map((image) => new URL(image.path, site).toString()),
    artform: artwork.modality.name,
    artMedium: artwork.techniqueLabel,
    genre: artwork.category.name,
    url: new URL(`/obra/${artwork.slug}`, site).toString(),
    creator: { "@type": "Person", name: "Carla", url: site },
    publisher: { "@type": "Organization", name: SITE_NAME, url: site },
  };
  return (
    <script
      type="application/ld+json"
      // "<" escapado: o texto vem do banco e não pode fechar a tag <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
