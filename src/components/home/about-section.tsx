import Image from "next/image";
import { ActionLink } from "@/components/ui/button-link";
import { Container, Eyebrow, ScriptLine } from "@/components/ui/layout";
import type { SiteSettings } from "@/features/settings/site-settings";

type AboutSectionProps = {
  about: SiteSettings["about"];
  /** Na home: apresentação curta e link para a página completa. */
  variant?: "summary" | "full";
  headingLevel?: "h1" | "h2";
};

export function AboutSection({ about, variant = "summary", headingLevel = "h2" }: AboutSectionProps) {
  const Heading = headingLevel;
  const paragraphs = (
    variant === "full" ? [about.intro, about.story, about.process, about.differentials] : [about.intro, about.process]
  ).filter((text) => text.trim() !== "");

  return (
    <section aria-labelledby="sobre-titulo" className="bg-white py-16 md:py-22">
      <Container className="grid items-center gap-10 md:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex justify-center">
          <Image
            src={about.photo.path}
            alt={about.photo.alt}
            width={360}
            height={460}
            sizes="(min-width: 768px) 360px, 80vw"
            // Na página Sobre a foto é o maior elemento da primeira tela.
            loading={variant === "full" ? "eager" : undefined}
            fetchPriority={variant === "full" ? "high" : undefined}
            className="block h-[380px] w-full max-w-[300px] rounded-t-full object-cover md:h-[460px] md:max-w-[360px]"
            style={{ objectPosition: `${about.photo.focalX}% ${about.photo.focalY}%` }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Eyebrow>Sobre a artista</Eyebrow>
          <Heading id="sobre-titulo" className="font-serif text-section font-normal md:text-section-lg">
            {about.heading}
          </Heading>
          <ScriptLine className="-mt-1.5 text-orange-script">{about.signature}</ScriptLine>
          {paragraphs.map((text) => (
            <p key={text} className="leading-[1.75] text-plum-soft">
              {text}
            </p>
          ))}
          {variant === "summary" && <ActionLink href="/sobre" className="mt-1.5">Conheça a artista</ActionLink>}
        </div>
      </Container>
    </section>
  );
}
