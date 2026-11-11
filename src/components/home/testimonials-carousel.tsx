"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@/components/ui/icons";
import type { Testimonial } from "@/features/testimonials/testimonials";

/**
 * Um depoimento por vez. Arrasta com o dedo (rolagem com encaixe), e as setas
 * dão a volta: do último vai para o primeiro. Sem troca automática: quem está
 * lendo decide quando passar (e leitores de tela não são interrompidos).
 */
export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  /** Destino de uma rolagem feita pelas setas (null quando é a pessoa arrastando). */
  const targetRef = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  const updateCurrent = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    // Durante a animação das setas, as posições intermediárias não contam:
    // um segundo clique rápido partiria do depoimento errado.
    const target = targetRef.current;
    if (target !== null) {
      if (Math.abs(track.scrollLeft - target * track.clientWidth) > 2) return;
      targetRef.current = null;
    }
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Tocou, arrastou ou rolou no meio da animação: volta a seguir a pessoa.
    const release = () => {
      targetRef.current = null;
    };
    track.addEventListener("scroll", updateCurrent, { passive: true });
    track.addEventListener("pointerdown", release, { passive: true });
    track.addEventListener("wheel", release, { passive: true });
    track.addEventListener("keydown", release);
    return () => {
      track.removeEventListener("scroll", updateCurrent);
      track.removeEventListener("pointerdown", release);
      track.removeEventListener("wheel", release);
      track.removeEventListener("keydown", release);
    };
  }, [updateCurrent]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = (index + total) % total;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targetRef.current = target;
    track.scrollTo({ left: target * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setCurrent(target);
  };

  const arrow =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors";

  return (
    <div aria-roledescription="carrossel" aria-label="Depoimentos" className="mt-10 flex flex-col gap-6">
      {/* tabIndex: quem usa teclado foca a faixa e passa os depoimentos com as setas. */}
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Depoimentos (use as setas do teclado para passar)"
        className="scrollbar-none relative flex snap-x snap-mandatory overflow-x-auto rounded-[2rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum"
      >
        {testimonials.map((t, index) => (
          <li
            key={t.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${total}`}
            className="flex w-full shrink-0 snap-center justify-center px-1"
          >
            <figure className="flex w-full max-w-3xl flex-col items-center justify-center gap-5 rounded-[2rem] border border-border bg-white px-6 py-10 text-center md:px-16 md:py-14">
              <span aria-hidden="true" className="h-10 font-serif text-[88px] leading-none text-orange-script">
                “
              </span>
              {t.rating !== null && (
                <div role="img" aria-label={`${t.demo ? "Nota de exemplo" : "Nota"}: ${t.rating} de 5`} className="flex gap-1 text-orange-script">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon key={i} size={18} fill={i < (t.rating ?? 0) ? "currentColor" : "none"} />
                  ))}
                </div>
              )}
              <blockquote className="font-serif text-[22px] leading-[1.45] italic text-plum md:text-[28px]">
                {t.text}
              </blockquote>
              <figcaption className="flex items-center gap-3 text-sm text-plum-muted">
                <span aria-hidden="true" className="h-px w-8 bg-pink" />
                <span>
                  {t.name}
                  {t.location && ` · ${t.location}`}
                </span>
                <span aria-hidden="true" className="h-px w-8 bg-pink" />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className={`${arrow} border-border-strong bg-white text-plum hover:border-plum`}
          >
            <ArrowLeftIcon size={18} />
            <span className="sr-only">Depoimento anterior</span>
          </button>

          {/* Celular: contador. A partir do tablet: um botão por depoimento. */}
          <p className="min-w-16 text-center text-sm text-plum-muted sm:hidden" aria-live="polite">
            {current + 1} de {total}
          </p>
          <ul className="hidden items-center sm:flex">
            {testimonials.map((t, index) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={index === current ? "true" : undefined}
                  className="group inline-flex size-11 items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className={`block rounded-full transition-all ${
                      index === current ? "h-2.5 w-6 bg-orange-cta" : "size-2.5 bg-pink group-hover:bg-rose"
                    }`}
                  />
                  <span className="sr-only">Depoimento {index + 1}</span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className={`${arrow} border-plum bg-plum text-cream hover:border-rose hover:bg-rose`}
          >
            <ArrowRightIcon size={18} />
            <span className="sr-only">Próximo depoimento</span>
          </button>
        </div>
      )}
    </div>
  );
}
