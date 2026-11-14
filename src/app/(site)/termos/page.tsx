import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";
import { getLegalTexts, paragraphs } from "@/features/settings/site-settings";

export const metadata: Metadata = { title: "Termos de uso" };

// O texto vem da Carla ou de um profissional (painel > Textos): não é redigido aqui.
export default async function TermsPage() {
  const texts = await getLegalTexts();
  const body = paragraphs(texts.terms);
  return (
    <>
      <PageIntro eyebrow="Institucional" title="Termos de uso" />
      <Container className="py-14 md:py-18">
        <div className="flex max-w-2xl flex-col gap-5 leading-[1.75] text-plum-soft">
          {body.length > 0 ? (
            body.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))
          ) : (
            <p>[Texto dos termos de uso, pendente.]</p>
          )}
        </div>
      </Container>
    </>
  );
}
