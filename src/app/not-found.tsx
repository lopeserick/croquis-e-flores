import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <p className="font-script text-3xl text-orange-script">ops</p>
      <h1 className="font-serif text-hero font-normal">Página não encontrada</h1>
      <p className="max-w-md text-plum-muted">
        O endereço pode ter mudado ou a obra não está mais publicada.
      </p>
      <div className="flex flex-wrap justify-center gap-3.5">
        <ButtonLink href="/galeria">Ver a galeria</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  );
}
