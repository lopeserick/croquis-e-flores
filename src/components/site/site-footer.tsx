import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import type { SiteSettings } from "@/features/settings/site-settings";
import { footerNav, legalNav, ORDER_HREF } from "@/features/site/navigation";
import { ContactList } from "./contact-list";
import { CopyrightYear } from "./copyright-year";
import { Logo } from "./logo";

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-apricot">{children}</h2>;
}

const footerLink = "inline-flex min-h-11 items-center text-blush no-underline hover:text-apricot";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-plum pt-16 pb-8 text-blush md:pt-18">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Logo variant="light" className="self-start" />
            <p className="text-sm leading-relaxed text-mauve">{settings.footerDescription}</p>
          </div>

          <nav aria-labelledby="rodape-navegacao">
            <ColumnTitle>
              <span id="rodape-navegacao">Navegação</span>
            </ColumnTitle>
            <ul className="flex flex-col text-sm">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm">
            <ColumnTitle>Contato</ColumnTitle>
            <ContactList settings={settings} />
          </div>

          <div className="flex flex-col text-sm">
            <ColumnTitle>Institucional</ColumnTitle>
            <ul className="flex flex-col">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href={ORDER_HREF} variant="onDark" size="sm" className="mt-3 self-start">
              Encomende já
            </ButtonLink>
          </div>
        </div>

        <p className="mt-14 border-t border-plum-line pt-6 text-[13px] text-mauve">
          © <CopyrightYear /> {settings.siteName}. Todos os direitos reservados.
        </p>
      </Container>
    </footer>
  );
}
