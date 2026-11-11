import Image from "next/image";
import Link from "next/link";
import type { CategoryRow } from "@/features/catalog/types";
import { focalPosition } from "./artwork-card";
import { LogoSymbol } from "./logo";

/** Coleção da home: foto circular, nome e frase curta. Leva à galeria da categoria. */
export function CollectionCircle({ category }: { category: CategoryRow }) {
  return (
    <Link
      href={`/galeria/${category.slug}`}
      className="group flex flex-col items-center gap-3 text-center no-underline"
    >
      <span className="relative flex size-36 items-center justify-center overflow-hidden rounded-full border-[6px] border-blush bg-peach-soft transition-colors group-hover:border-pink sm:size-[200px] lg:size-[168px] xl:size-[200px]">
        {category.image ? (
          <Image
            src={category.image.path}
            alt=""
            fill
            sizes="(min-width: 1280px) 200px, (min-width: 1024px) 168px, (min-width: 640px) 200px, 144px"
            className="object-cover"
            style={{ objectPosition: focalPosition(category.image) }}
          />
        ) : (
          // Coleção ainda sem foto: símbolo da marca no lugar.
          <LogoSymbol className="h-3/4" />
        )}
      </span>
      <span className="font-serif text-[1.375rem] leading-tight group-hover:text-rose sm:text-[26px]">
        {category.name}
      </span>
      <span className="-mt-1.5 text-sm text-plum-muted">{category.tagline}</span>
    </Link>
  );
}
