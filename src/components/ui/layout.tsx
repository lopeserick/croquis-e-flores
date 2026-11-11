import type { ComponentProps, ReactNode } from "react";

/** Largura máxima de 1280px com margem lateral de 16px no celular e 32px a partir do tablet. */
export function Container({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-7xl px-4 md:px-8 ${className}`} {...props} />;
}

/** Etiqueta em caixa alta acima de títulos ("PORTFÓLIO", "SOBRE A ARTISTA"). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs uppercase tracking-eyebrow text-rose ${className}`}>{children}</p>
  );
}

/** Chamada manuscrita pontual ("escolha seu tema"). */
export function ScriptLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-script text-[1.75rem] leading-tight md:text-3xl ${className}`}>{children}</p>;
}

export function SectionTitle({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h2 id={id} className={`font-serif text-section font-normal md:text-section-lg ${className}`}>
      {children}
    </h2>
  );
}
