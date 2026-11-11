import { Container, SectionTitle } from "@/components/ui/layout";

const steps = [
  {
    title: "Envie sua inspiração",
    text: "Mande uma fotografia ou descreva a ideia que você quer ver na tela.",
  },
  {
    title: "Personalize sua obra",
    text: "Escolha modalidade, técnica, tamanho e a data em que gostaria de receber.",
  },
  {
    title: "Receba sua arte",
    text: "A artista envia o orçamento, confirma o prazo e produz a sua obra.",
  },
];

/** Seta tracejada entre os passos (só a partir do tablet), dentro do espaço entre colunas. */
function DashedArrow() {
  return (
    <svg
      width="60"
      height="64"
      viewBox="0 0 60 64"
      fill="none"
      stroke="#D9708A"
      strokeWidth="1.5"
      strokeDasharray="4 5"
      aria-hidden="true"
      focusable="false"
      className="absolute top-0 -left-[62px] hidden md:block"
    >
      <path d="M2 32h52M48 26l6 6-6 6" />
    </svg>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="scroll-mt-20 bg-peach-soft py-16 md:py-22 lg:scroll-mt-0"
    >
      <Container className="text-center">
        <SectionTitle id="como-funciona-titulo">Como funciona</SectionTitle>
        <p className="mt-2.5 text-plum-muted">Três passos entre a sua memória e a obra pronta.</p>
        <ol className="mx-auto mt-10 grid max-w-[1150px] gap-10 md:mt-13 md:grid-cols-3 md:gap-16">
          {steps.map((step, i) => (
            <li key={step.title} className="relative mx-auto flex max-w-[340px] flex-col items-center gap-3.5">
              {i > 0 && <DashedArrow />}
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-orange-cta font-serif text-[30px] text-white"
              >
                {i + 1}
              </span>
              <h3 className="font-serif text-[26px] leading-tight font-medium">
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
