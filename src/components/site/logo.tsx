import Link from "next/link";

// Logo provisória (opção 3, silhueta de croqui). Versão do protótipo, com
// traço reforçado para tamanho de cabeçalho. A versão final será desenhada
// pela Carla (docs/decisoes.md).

const palettes = {
  default: {
    line: "#2D1B1F",
    bodice: "#FFF7F2",
    skirtLine: "#A8324F",
    skirt: "#F2B8B5",
    name: "text-plum",
    script: "text-orange-cta",
  },
  light: {
    line: "#FFF7F2",
    bodice: "#2D1B1F",
    skirtLine: "#F7C59F",
    skirt: "#D9708A",
    name: "text-cream",
    script: "text-apricot",
  },
} as const;

export function LogoSymbol({
  variant = "default",
  className = "",
}: {
  variant?: keyof typeof palettes;
  className?: string;
}) {
  const c = palettes[variant];
  return (
    <svg viewBox="0 0 200 360" fill="none" aria-hidden="true" focusable="false" className={className}>
      <ellipse cx="100" cy="42" rx="13" ry="16" stroke={c.line} strokeWidth="4" />
      <circle cx="110" cy="25" r="8" fill={c.line} />
      <path d="M100 58 L100 74" stroke={c.line} strokeWidth="4" />
      <path d="M80 80 C74 100 74 120 80 142" stroke={c.line} strokeWidth="4" strokeLinecap="round" />
      <path d="M120 80 C130 100 131 122 125 146" stroke={c.line} strokeWidth="4" strokeLinecap="round" />
      <path d="M80 80 Q100 72 120 80 L113 122 Q100 128 87 122 Z" stroke={c.line} strokeWidth="4" fill={c.bodice} />
      <path
        d="M87 122 C62 180 44 262 30 344 C72 326 128 326 170 344 C156 262 138 180 113 122 Z"
        stroke={c.skirtLine}
        strokeWidth="4"
        fill={c.skirt}
      />
      <path d="M98 128 C92 200 90 270 98 330" stroke={c.skirtLine} strokeWidth="2.5" />
      <path d="M106 128 C124 196 134 262 146 330" stroke={c.skirtLine} strokeWidth="2.5" />
      <circle cx="88" cy="124" r="14" fill="#E8743B" />
    </svg>
  );
}

export function Logo({
  variant = "default",
  size = "md",
  className = "",
}: {
  variant?: keyof typeof palettes;
  size?: "sm" | "md";
  className?: string;
}) {
  const c = palettes[variant];
  const small = size === "sm";
  return (
    <Link
      href="/"
      // O nome acessível começa pelo texto visível (WCAG 2.5.3, rótulo no nome).
      aria-label="Croquis e flores, página inicial"
      className={`inline-flex items-center gap-2.5 leading-none no-underline ${className}`}
    >
      <LogoSymbol variant={variant} className={small ? "h-11 w-auto" : "h-[72px] w-auto"} />
      <span className="flex flex-col">
        <span className={`font-serif ${small ? "text-[26px]" : "text-[38px]"} leading-[0.95] ${c.name}`}>
          Croquis
        </span>{" "}
        <span
          className={`font-script ${small ? "pl-5 text-lg" : "pl-[34px] text-[26px]"} leading-[1.1] ${c.script}`}
        >
          e flores
        </span>
      </span>
    </Link>
  );
}
