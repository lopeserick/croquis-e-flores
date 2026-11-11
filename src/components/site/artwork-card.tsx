import Image from "next/image";
import { ActionLink } from "@/components/ui/button-link";
import type { ArtworkSummary, ImageAsset } from "@/features/catalog/types";

export const focalPosition = (image: ImageAsset) => `${image.focalX}% ${image.focalY}%`;

/** Card de obra: foto 4:5, selo da modalidade, categoria · técnica, título. Sem preço. */
export function ArtworkCard({
  artwork,
  headingLevel = "h3",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw",
  eager = false,
}: {
  artwork: ArtworkSummary;
  headingLevel?: "h2" | "h3";
  sizes?: string;
  /** Primeiros cards de uma lista: a foto aparece na primeira tela, então não espera a rolagem. */
  eager?: boolean;
}) {
  const Heading = headingLevel;
  return (
    <article className="flex h-full flex-col gap-2.5">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-blush">
        <Image
          src={artwork.cover.path}
          alt={artwork.cover.alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : undefined}
          fetchPriority={eager ? "high" : undefined}
          className="object-cover"
          style={{ objectPosition: focalPosition(artwork.cover) }}
        />
        <span className="absolute top-3.5 left-3.5 rounded-full bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-rose">
          {artwork.modality.name}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-rose">
        {artwork.category.name} · {artwork.techniqueLabel}
      </p>
      <Heading className="font-serif text-2xl leading-tight font-medium">{artwork.title}</Heading>
      <p className="text-sm leading-relaxed text-plum-muted">{artwork.shortDescription}</p>
      <ActionLink href={`/obra/${artwork.slug}`} className="mt-auto">
        Ver detalhes<span className="sr-only">: {artwork.title}</span>
      </ActionLink>
    </article>
  );
}
