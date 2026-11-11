import { StarIcon } from "@/components/ui/icons";
import { Container, SectionTitle } from "@/components/ui/layout";
import type { Testimonial } from "@/features/testimonials/testimonials";

function Rating({ value, demo }: { value: number; demo: boolean }) {
  return (
    <div
      role="img"
      aria-label={`${demo ? "Nota de exemplo" : "Nota"}: ${value} de 5`}
      className="flex gap-1 text-orange-script"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={18} fill={i < value ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

/** Some quando não há depoimentos; os de exemplo vêm sempre identificados. */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const hasDemo = testimonials.some((t) => t.demo);

  return (
    <section aria-labelledby="depoimentos-titulo" className="bg-cream py-16 md:py-22">
      <Container>
        <div className="text-center">
          <SectionTitle id="depoimentos-titulo">Quem já encomendou</SectionTitle>
          {hasDemo && (
            <p className="mt-3.5 inline-block rounded-full bg-blush px-3.5 py-1.5 text-xs text-rose">
              Conteúdo demonstrativo: substituir por avaliações reais antes de publicar
            </p>
          )}
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id}>
              <figure className="flex h-full flex-col gap-3.5 rounded-card border border-border bg-white p-7">
                {t.rating !== null && <Rating value={t.rating} demo={t.demo} />}
                <blockquote className="font-serif text-[21px] leading-[1.45] italic">{t.text}</blockquote>
                <figcaption className="mt-auto text-[13px] text-plum-muted">
                  {t.name}
                  {t.location && ` · ${t.location}`}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
