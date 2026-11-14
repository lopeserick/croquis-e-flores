import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, ListSkeleton } from "@/components/admin/admin-ui";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { ArtworkPhotos } from "@/components/admin/artwork-photos";
import { ArtworkStatusPanel } from "@/components/admin/artwork-status";
import { publishProblems } from "@/features/admin/artwork-rules";
import { getAdminArtwork, getArtworkFormOptions } from "@/features/admin/artworks";

export const metadata: Metadata = { title: "Obra" };

export default function ArtworkPage(props: PageProps<"/admin/obras/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/obras">Todas as obras</BackLink>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Artwork params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Artwork({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [artwork, options] = await Promise.all([getAdminArtwork(id), getArtworkFormOptions()]);
  if (!artwork) notFound();
  const problems = publishProblems(artwork, artwork.images);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-section leading-tight [overflow-wrap:anywhere] md:text-section-lg">{artwork.title}</h1>
      {query.criada === "1" && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          Obra criada como rascunho. Agora envie as fotos e publique.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <ArtworkPhotos artwork={artwork} />
          <ArtworkForm artwork={artwork} options={options} />
        </div>
        <div className="flex flex-col gap-6">
          <ArtworkStatusPanel id={artwork.id} slug={artwork.slug} status={artwork.status} problems={problems} />
        </div>
      </div>
    </div>
  );
}
