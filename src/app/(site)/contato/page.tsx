import type { Metadata } from "next";
import { ContactList } from "@/components/site/contact-list";
import { PageIntro } from "@/components/site/page-intro";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import { getSiteSettings } from "@/features/settings/site-settings";
import { ORDER_HREF } from "@/features/site/navigation";

export const metadata: Metadata = { title: "Contato" };

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <PageIntro eyebrow="Fale com a artista" title="Contato">
        <p>
          Para pedir um orçamento, o caminho mais rápido é a página de encomenda: você conta sua ideia,
          envia as fotos de referência e a artista recebe tudo de uma vez.
        </p>
      </PageIntro>
      <Container className="flex flex-col items-start gap-8 py-14 md:py-18">
        <ButtonLink href={ORDER_HREF}>Encomende já</ButtonLink>
        <div>
          <h2 className="mb-2 font-serif text-[28px]">Outros contatos</h2>
          <ContactList settings={settings} tone="light" />
        </div>
      </Container>
    </>
  );
}
