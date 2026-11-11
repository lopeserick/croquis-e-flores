"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button-link";
import { Container, Eyebrow } from "@/components/ui/layout";

/**
 * Falha ao carregar uma página (ex.: banco fora do ar). O cabeçalho e o rodapé
 * continuam na tela; aqui o visitante pode tentar de novo ou seguir navegando.
 */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-start gap-5 py-20 md:py-28">
      <Eyebrow>Algo deu errado</Eyebrow>
      <h1 className="font-serif text-hero font-normal md:text-hero-lg">Não foi possível carregar esta página.</h1>
      <p className="max-w-xl text-[17px] leading-[1.7] text-plum-soft">
        Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.
      </p>
      <div className="flex flex-wrap gap-3.5">
        <button type="button" onClick={() => retry()} className={buttonClasses("primary")}>
          Tentar de novo
        </button>
        <Link href="/" className={buttonClasses("secondary")}>
          Voltar ao início
        </Link>
      </div>
    </Container>
  );
}
