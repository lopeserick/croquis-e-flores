import { Container, SectionTitle } from "@/components/ui/layout";
import type { SiteSettings } from "@/features/settings/site-settings";

/** Seta tracejada entre os passos (só no computador, quando ficam lado a lado). */
function DashedArrow() {
  return (
    <svg
      width="40"
      height="64"
      viewBox="0 0 40 64"
      fill="none"
      stroke="#D9708A"
      strokeWidth="1.5"
      strokeDasharray="4 5"
      aria-hidden="true"
      focusable="false"
      className="absolute top-0 -left-[44px] hidden lg:block"
    >
      <path d="M2 32h34M30 26l6 6-6 6" />
    </svg>
  );
}

export function HowItWorksSection({ howItWorks }: { howItWorks: SiteSettings["howItWorks"] }) {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="scroll-mt-20 bg-peach-soft py-16 md:py-22 lg:scroll-mt-0"
    >
      <Container className="text-center">
        <SectionTitle id="como-funciona-titulo">Como funciona</SectionTitle>
        {howItWorks.subtitle && <p className="mt-2.5 text-plum-muted">{howItWorks.subtitle}</p>}
        <ol className="mx-auto mt-10 flex max-w-[1150px] flex-wrap justify-center gap-10 md:mt-13 lg:flex-nowrap lg:gap-12">
          {howItWorks.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex w-full max-w-[340px] flex-col items-center gap-3.5 sm:w-[calc(50%-1.25rem)] lg:w-auto lg:flex-1"
            >
              {i > 0 && <DashedArrow />}
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-orange-cta font-serif text-[30px] text-white"
              >
                {i + 1}
              </span>
              <h3 className="font-serif text-[24px] leading-tight font-medium">
                <span className="sr-only">Passo {i + 1}: </span>
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-plum-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
