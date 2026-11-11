import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import type { SiteSettings } from "@/features/settings/site-settings";
import { ORDER_HREF } from "@/features/site/navigation";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchForm } from "./search-form";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <p className="bg-rose px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-cream md:text-xs">
        {settings.topBarMessage}
      </p>

      {/* Celular e tablet: barra compacta e fixa no topo, com o CTA sempre visível. */}
      <header className="sticky top-0 z-40 border-b border-border bg-cream lg:hidden">
        <Container className="flex h-16 items-center justify-between gap-2">
          <MobileMenu instagramHandle={settings.instagramHandle} />
          <Logo size="sm" />
          <ButtonLink href={ORDER_HREF} size="sm" className="px-4">
            Encomende já
          </ButtonLink>
        </Container>
      </header>

      {/* Desktop: busca, logo central e CTA; menu centralizado abaixo. */}
      <header className="hidden border-b border-border bg-cream lg:block">
        <Container className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-5">
          <SearchForm id="busca-cabecalho" className="w-56" />
          <Logo />
          <ButtonLink href={ORDER_HREF} size="sm" className="justify-self-end">
            Encomende já
          </ButtonLink>
        </Container>
        <Container>
          <nav aria-label="Principal" className="pt-3 pb-2">
            <Suspense fallback={<MainNav withActiveState={false} />}>
              <MainNav />
            </Suspense>
          </nav>
        </Container>
      </header>
    </>
  );
}
