import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow } from "@/components/ui/layout";
import { ORDER_HREF } from "@/features/site/navigation";

/** Cabeçalho padrão das páginas internas: etiqueta, título e texto curto. */
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-blush py-12 md:py-18">
      <Container className="flex flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-serif text-hero font-normal md:text-hero-lg">{title}</h1>
        {children && <div className="max-w-2xl text-[17px] leading-[1.7] text-plum-soft">{children}</div>}
      </Container>
    </section>
  );
}

/** Mesmo espaço do PageIntro enquanto o título carrega. */
export function PageIntroSkeleton() {
  return (
    <section aria-busy="true" className="bg-blush py-12 md:py-18">
      <Container className="flex flex-col gap-4">
        <p className="sr-only" role="status">
          Carregando…
        </p>
        <div className="h-3 w-24 rounded-full bg-pink/60" />
        <div className="h-10 w-2/3 max-w-md animate-pulse rounded-full bg-pink/60 motion-reduce:animate-none md:h-16" />
        <div className="h-4 w-1/2 max-w-sm rounded-full bg-pink/60" />
      </Container>
    </section>
  );
}

/**
 * Página que ainda será construída em uma próxima entrega. Explica isso ao
 * visitante e oferece caminhos que já funcionam, em vez de um erro 404.
 */
export function UnderConstruction({
  eyebrow,
  title,
  description,
  delivery,
  showOrderButton = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  delivery: number;
  /** Desligado na própria página de encomenda, para o botão não apontar para si mesmo. */
  showOrderButton?: boolean;
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title}>
        <p>{description}</p>
      </PageIntro>
      <Container className="flex flex-col items-start gap-6 py-14">
        <p className="rounded-full bg-peach-soft px-4 py-2 text-sm text-plum-soft">
          Página em construção (prevista para a entrega {delivery} do plano).
        </p>
        <div className="flex flex-wrap gap-3.5">
          {showOrderButton && <ButtonLink href={ORDER_HREF}>Encomende já</ButtonLink>}
          <ButtonLink href="/" variant="secondary">
            Voltar ao início
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
