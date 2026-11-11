import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = { title: "Política de privacidade" };

// O texto (LGPD) vem da Carla ou de um profissional: não é redigido aqui.
export default function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="Institucional" title="Política de privacidade" />
      <Container className="py-14 md:py-18">
        <p className="max-w-2xl leading-[1.75] text-plum-soft">
          [Texto da política de privacidade e tratamento de dados (LGPD), pendente.]
        </p>
      </Container>
    </>
  );
}
