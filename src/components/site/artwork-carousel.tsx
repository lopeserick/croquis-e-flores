"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

/**
 * Vitrine com rolagem horizontal. No celular, arrasta-se com o dedo; as setas
 * avançam um card por vez e ficam desativadas no início e no fim da lista.
 */
export function ArtworkCarousel({
  header,
  headerAction,
  label,
  children,
}: {
  header: ReactNode;
  headerAction: ReactNode;
  label: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // Margem de 2px absorve arredondamentos de zoom do navegador.
    setCanPrev(track.scrollLeft > 2);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  const arrow =
    "inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {header}
        <div className="flex items-center gap-2.5">
          {headerAction}
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            className={`${arrow} ml-2.5 border-border-strong bg-white text-plum enabled:hover:border-plum`}
          >
            <ArrowLeftIcon size={18} />
            <span className="sr-only">Obras anteriores</span>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            className={`${arrow} border-plum bg-plum text-cream enabled:hover:bg-rose enabled:hover:border-rose`}
          >
            <ArrowRightIcon size={18} />
            <span className="sr-only">Próximas obras</span>
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        aria-label={label}
        // `relative`: textos sr-only (posição absoluta) dos cards fora da área
        // visível ficam presos à lista, sem esticar a largura da página.
        className="scrollbar-none relative -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-7 overflow-x-auto px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {Children.map(children, (child) => (
          <li className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.75rem)/2)] lg:w-[calc((100%-5.25rem)/4)]">
            {child}
          </li>
        ))}
      </ul>
    </>
  );
}
