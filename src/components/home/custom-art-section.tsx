import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, ScriptLine } from "@/components/ui/layout";
import type { ImageAsset } from "@/features/catalog/types";
import { ORDER_HREF } from "@/features/site/navigation";

/** Bloco editorial rosa: "Sua ideia, nossa arte." com a transformação foto → obra. */
export function CustomArtSection({ example }: { example: ImageAsset | null }) {
  return (
    <section aria-labelledby="personalize-titulo" className="bg-rose py-16 text-cream md:py-22">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <ScriptLine className="text-apricot md:text-[34px]">exclusivo para você</ScriptLine>
          <h2 id="personalize-titulo" className="font-serif text-section font-normal md:text-feature-lg">
            Sua ideia, nossa arte.
          </h2>
          <p className="max-w-[480px] text-[17px] leading-[1.7] text-blush">
            Tem uma fotografia especial, uma paisagem inesquecível ou uma ideia que gostaria de
            transformar em arte? Vamos criar algo exclusivo para você.
          </p>
          <ButtonLink href={ORDER_HREF} variant="onDark" className="mt-2 self-start">
            Personalize seu quadro
          </ButtonLink>
        </div>

        {example && (
          <div aria-hidden="true" className="flex flex-wrap items-center justify-center gap-5 md:gap-7">
            <div className="-rotate-6 bg-white px-3 pt-3 pb-10">
              <div className="flex size-32 items-center justify-center bg-mauve text-xs text-plum md:size-[170px]">
                sua foto
              </div>
            </div>
            <svg width="56" height="24" viewBox="0 0 56 24" fill="none" stroke="#F7C59F" strokeWidth="2" focusable="false">
              <path d="M2 12h48M44 5l7 7-7 7" />
            </svg>
            <div className="border-[6px] border-wood bg-white p-3.5">
              <Image
                src={example.path}
                alt=""
                width={260}
                height={230}
                sizes="(min-width: 768px) 260px, 200px"
                className="block h-44 w-[200px] object-cover md:h-[230px] md:w-[260px]"
                style={{ objectPosition: `${example.focalX}% ${example.focalY}%` }}
              />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
