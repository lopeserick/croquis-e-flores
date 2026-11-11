import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GallerySkeleton, GalleryView } from "@/components/gallery/gallery-view";
import { PageIntro, PageIntroSkeleton } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";
import type { SearchParams } from "@/features/catalog/gallery-filters";
import { getActiveCategories, getCategoryBySlug } from "@/features/catalog/queries";
import { pageMetadata } from "@/features/site/seo";

export async function generateStaticParams() {
  const categories = await getActiveCategories();
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata(props: PageProps<"/galeria/[categoria]">): Promise<Metadata> {
  const { categoria } = await props.params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return { title: "Galeria" };
  return pageMetadata({
    title: `${category.name} · Galeria`,
    description: `${category.tagline}. Obras da coleção ${category.name} criadas pela artista Carla.`,
    path: `/galeria/${category.slug}`,
    image: category.image,
  });
}

// O endereço (coleção e filtros) é lido dentro de Suspense: cabeçalho e rodapé
// aparecem na hora ao navegar, e o conteúdo entra em seguida.
export default function CategoryPage(props: PageProps<"/galeria/[categoria]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageIntroSkeleton />
          <Container className="py-12 md:py-16">
            <GallerySkeleton />
          </Container>
        </>
      }
    >
      <CategoryContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  return (
    <>
      <PageIntro eyebrow="Coleção" title={category.name}>
        <p>{category.tagline}.</p>
      </PageIntro>
      <Container className="py-12 md:py-16">
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryView searchParams={searchParams} categorySlug={category.slug} />
        </Suspense>
      </Container>
    </>
  );
}
