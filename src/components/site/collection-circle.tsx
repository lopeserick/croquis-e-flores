import Image from "next/image";
import Link from "next/link";
import type { CategoryRow } from "@/features/catalog/types";
import { focalPosition } from "./artwork-card";

/** Coleção da home: foto circular, nome e frase curta. Leva à galeria da categoria. */
export function CollectionCircle({ category }: { category: CategoryRow }) {
  return (
    <Link
      href={`/galeria/${category.slug}`}
      className="group flex flex-col items-center gap-3 text-center no-underline"
    >
      <span className="relative block size-36 overflow-hidden rounded-full border-[6px] border-blush transition-colors group-hover:border-pink sm:size-[200px]">
        <Image
          src={category.image.path}
          alt=""
          fill
          sizes="(min-width: 640px) 200px, 144px"
          className="object-cover"
          style={{ objectPosition: focalPosition(category.image) }}
        />
      </span>
      <span className="font-serif text-[1.375rem] leading-tight group-hover:text-rose sm:text-[26px]">
        {category.name}
      </span>
      <span className="-mt-1.5 text-sm text-plum-muted">{category.tagline}</span>
    </Link>
  );
}
