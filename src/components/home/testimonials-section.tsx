import { Container, ScriptLine, SectionTitle } from "@/components/ui/layout";
import type { Testimonial } from "@/features/testimonials/testimonials";
import { TestimonialsCarousel } from "./testimonials-carousel";

/** Some quando não há depoimentos; os de exemplo vêm sempre identificados. */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const hasDemo = testimonials.some((t) => t.demo);

  return (
    <section aria-labelledby="depoimentos-titulo" className="bg-cream py-16 md:py-22">
      <Container>
        <div className="flex flex-col items-center text-center">
          <ScriptLine className="text-orange-script">palavras de carinho</ScriptLine>
          <SectionTitle id="depoimentos-titulo" className="mt-1">
            Quem já encomendou
          </SectionTitle>
          <p className="mt-2.5 text-plum-muted">Frases reais da nossa pesquisa de satisfação.</p>
          {hasDemo && (
            <p className="mt-3.5 inline-block rounded-full bg-blush px-3.5 py-1.5 text-xs text-rose">
              Conteúdo demonstrativo: substituir por avaliações reais antes de publicar
            </p>
          )}
        </div>
        <TestimonialsCarousel testimonials={testimonials} />
      </Container>
    </section>
  );
}
