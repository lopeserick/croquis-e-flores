import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = { title: "Termos de uso" };

// O texto vem da Carla ou de um profissional: não é redigido aqui.
export default function TermsPage() {
  return (
    <>
      <PageIntro eyebrow="Institucional" title="Termos de uso" />
      <Container className="py-14 md:py-18">
        <p className="max-w-2xl leading-[1.75] text-plum-soft">[Texto dos termos de uso, pendente.]</p>
      </Container>
    </>
  );
}
