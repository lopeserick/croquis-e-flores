import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";
import { getLegalTexts, paragraphs } from "@/features/settings/site-settings";

export const metadata: Metadata = { title: "Política de privacidade" };

// O texto vem da Carla ou de um profissional (painel > Textos): não é redigido aqui.
export default async function PrivacyPage() {
  const texts = await getLegalTexts();
  const body = paragraphs(texts.privacy);
  return (
    <>
      <PageIntro eyebrow="Institucional" title="Política de privacidade" />
      <Container className="py-14 md:py-18">
        <div className="flex max-w-2xl flex-col gap-5 leading-[1.75] text-plum-soft">
          {body.length > 0 ? (
            body.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))
          ) : (
            <p>[Texto da política de privacidade e tratamento de dados (LGPD), pendente.]</p>
          )}
        </div>
      </Container>
    </>
  );
}
