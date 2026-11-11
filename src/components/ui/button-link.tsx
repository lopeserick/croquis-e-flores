import Link from "next/link";
import type { ComponentProps } from "react";

// Botões em formato pílula (identidade-visual.md > Componentes). Todos são
// links: nesta versão, cada ação leva a uma página.
const variants = {
  /** Laranja: a ação principal. Um por área visível. */
  primary: "bg-orange-cta text-white hover:bg-plum",
  /** Contorno ameixa. */
  secondary: "border border-plum text-plum hover:bg-plum hover:text-cream",
  /** Damasco, para fundos escuros (bloco rosa, rodapé). */
  onDark: "bg-apricot text-plum hover:bg-cream",
} as const;

const sizes = {
  md: "min-h-12 px-8 text-[13px]",
  sm: "min-h-11 px-5 text-xs",
} as const;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Permite quebrar o texto em duas linhas (rótulos longos no celular). */
  wrap?: boolean;
};

export const buttonClasses = (variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md") =>
  `inline-flex items-center justify-center rounded-full text-center uppercase tracking-button transition-colors ${variants[variant]} ${sizes[size]}`;

export function ButtonLink({
  variant = "primary",
  size = "md",
  wrap = false,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${buttonClasses(variant, size)} ${wrap ? "py-3 leading-snug" : "whitespace-nowrap"} ${className}`}
      {...props}
    />
  );
}

/** Link de ação em caixa alta com sublinhado ("VER DETALHES"). */
export function ActionLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center self-start text-[13px] uppercase tracking-nav underline underline-offset-4 hover:text-rose ${className}`}
      {...props}
    />
  );
}
