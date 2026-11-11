import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import type { ArtworkSummary } from "@/features/catalog/types";
import { ORDER_HREF } from "@/features/site/navigation";
import { ArtworkCard } from "./artwork-card";

/** Até 4 por linha. Os 2 primeiros cards carregam a foto sem esperar a rolagem. */
export function ArtworkGrid({
  artworks,
  emptyState,
  headingLevel = "h2",
}: {
  artworks: ArtworkSummary[];
  /** O que mostrar quando a lista está vazia. Padrão: convite para encomendar. */
  emptyState?: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  if (artworks.length === 0) {
    return (
      emptyState ?? (
        <EmptyState title="Ainda não há obras publicadas aqui.">
          <p>Que tal criar a primeira? Conte sua ideia e a artista responde com um orçamento.</p>
        </EmptyState>
      )
    );
  }
  return (
    <ul className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {artworks.map((artwork, index) => (
        <li key={artwork.id}>
          <ArtworkCard
            artwork={artwork}
            headingLevel={headingLevel}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw"
            eager={index < 2}
          />
        </li>
      ))}
    </ul>
  );
}

/** Lista vazia: explica o motivo e oferece caminhos (nunca uma tela sem saída). */
export function EmptyState({
  title,
  children,
  actions,
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-card bg-peach-soft p-7 md:p-10">
      <p className="font-serif text-2xl md:text-[28px]">{title}</p>
      {children && <div className="max-w-xl leading-relaxed text-plum-muted">{children}</div>}
      <div className="flex flex-wrap gap-3.5">
        {actions}
        <ButtonLink href={ORDER_HREF}>Encomende já</ButtonLink>
      </div>
    </div>
  );
}
