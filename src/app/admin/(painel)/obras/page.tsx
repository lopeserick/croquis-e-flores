import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FilterTabs, iconButton, PageHeader, Pill, smallButton, ListSkeleton } from "@/components/admin/admin-ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { moveArtwork } from "@/features/admin/artwork-actions";
import { ARTWORK_STATUS_LABELS, ARTWORK_STATUSES, isArtworkStatus } from "@/features/admin/artwork-rules";
import { listAdminArtworks } from "@/features/admin/artworks";

export const metadata: Metadata = { title: "Obras" };

const FILTER_LABELS = { publicada: "Publicadas", rascunho: "Rascunhos", arquivada: "Arquivadas" } as const;

export default function ArtworksPage(props: PageProps<"/admin/obras">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Obras"
        description="As obras da galeria, na ordem em que aparecem no site."
        action={
          <Link href="/admin/obras/nova" className={`${smallButton} no-underline`}>
            Nova obra
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <Artworks searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Artworks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = isArtworkStatus(params.status) ? params.status : null;
  const all = await listAdminArtworks();
  const artworks = status ? all.filter((a) => a.status === status) : all;

  return (
    <>
      {params.apagada === "1" && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          Obra apagada.
        </p>
      )}
      <FilterTabs
        label="Filtrar obras"
        items={[
          { href: "/admin/obras", label: `Todas (${all.length})`, current: !status },
          ...ARTWORK_STATUSES.map((s) => ({
            href: `/admin/obras?status=${s}`,
            label: `${FILTER_LABELS[s]} (${all.filter((a) => a.status === s).length})`,
            current: status === s,
          })),
        ]}
      />
      {artworks.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-6 text-plum-muted">
          {status ? "Nenhuma obra nesta situação." : "Nenhuma obra cadastrada ainda."}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {artworks.map((artwork, index) => (
            <li key={artwork.id} className="flex items-center gap-3 rounded-card border border-border bg-white p-3 md:gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush">
                {artwork.coverUrl && <Image src={artwork.coverUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/admin/obras/${artwork.id}`}
                  className="inline-flex min-h-11 items-center font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline"
                >
                  {artwork.title}
                </Link>
                <p className="text-sm text-plum-muted">
                  {[artwork.categoryName, artwork.modalityName, artwork.techniqueLabel].filter(Boolean).join(" · ")}
                </p>
                <p className="flex flex-wrap gap-1.5">
                  <Pill tone={artwork.status === "publicada" ? "strong" : "neutral"}>
                    {ARTWORK_STATUS_LABELS[artwork.status]}
                  </Pill>
                  {artwork.featured && <Pill>Destaque</Pill>}
                  {artwork.imageCount === 0 && <Pill tone="warning">Sem foto</Pill>}
                </p>
              </div>
              {/* A ordem é a da galeria inteira: só dá para mudar vendo todas. */}
              {!status && (
                <form action={moveArtwork} className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <input type="hidden" name="id" value={artwork.id} />
                  <button type="submit" name="direction" value="up" disabled={index === 0} className={iconButton}>
                    <ArrowLeftIcon size={16} className="rotate-90" />
                    <span className="sr-only">Subir {artwork.title}</span>
                  </button>
                  <button
                    type="submit"
                    name="direction"
                    value="down"
                    disabled={index === artworks.length - 1}
                    className={iconButton}
                  >
                    <ArrowRightIcon size={16} className="rotate-90" />
                    <span className="sr-only">Descer {artwork.title}</span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
