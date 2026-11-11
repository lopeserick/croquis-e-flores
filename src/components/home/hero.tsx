import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow } from "@/components/ui/layout";
import type { SiteSettings } from "@/features/settings/site-settings";
import { ORDER_HREF } from "@/features/site/navigation";

const highlightDots = ["bg-orange", "bg-pink-mid", "bg-rose"];

export function Hero({ hero }: { hero: SiteSettings["hero"] }) {
  return (
    <section aria-labelledby="hero-titulo" className="bg-blush">
      <Container className="grid lg:grid-cols-[minmax(0,44fr)_minmax(0,52fr)]">
        <div className="flex flex-col justify-center gap-5 py-12 md:py-16 lg:py-20 lg:pr-12">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 id="hero-titulo" className="font-serif text-hero font-normal md:text-hero-lg">
            {hero.title} <em className="text-rose">{hero.titleEmphasis}</em>
          </h1>
          <p className="max-w-[460px] text-[17px] leading-[1.7] text-plum-soft">{hero.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-3.5">
            <ButtonLink href={ORDER_HREF}>Encomende já</ButtonLink>
            <ButtonLink href="/galeria" variant="secondary">
              Explore a galeria
            </ButtonLink>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-plum-soft">
            {hero.highlights.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span aria-hidden="true" className={`size-2 rounded-full ${highlightDots[i % highlightDots.length]}`} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Obra emoldurada numa parede rosa: ilustração do protótipo, feita em CSS. */}
        <figure className="relative -mx-4 min-h-[400px] overflow-hidden bg-wall md:-mx-8 md:min-h-[520px] lg:mx-0 lg:min-h-[560px]">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-floor md:h-24" />
          <div aria-hidden="true" className="absolute right-[8%] bottom-20 h-14 w-40 rounded-t-md bg-wood md:bottom-24 md:h-[74px] md:w-[210px]" />
          <div aria-hidden="true" className="absolute right-[calc(8%+24px)] bottom-[136px] h-14 w-7 rounded-t-[14px] rounded-b-md bg-rose md:right-[calc(8%+30px)] md:bottom-[170px] md:h-[76px] md:w-[34px]" />
          <div aria-hidden="true" className="absolute right-[calc(8%+96px)] bottom-[136px] size-9 rounded-full bg-apricot md:right-[calc(8%+120px)] md:bottom-[170px] md:size-[46px]" />
          <div className="absolute top-8 left-1/2 -translate-x-[62%] border-[8px] border-wood bg-white p-3 md:top-12 md:border-[10px] md:p-[18px]">
            <Image
              src={hero.image.path}
              alt={hero.image.alt}
              width={330}
              height={330}
              preload
              sizes="(min-width: 768px) 330px, 220px"
              className="block size-[220px] object-cover md:size-[330px]"
              style={{ objectPosition: `${hero.image.focalX}% ${hero.image.focalY}%` }}
            />
          </div>
          <figcaption className="absolute bottom-4 left-4 rounded-full bg-cream px-3 py-1.5 text-xs text-plum-muted md:bottom-5 md:left-5">
            {hero.imageCaption}
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
