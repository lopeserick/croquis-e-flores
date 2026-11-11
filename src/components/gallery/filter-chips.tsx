import Link from "next/link";

export type Chip = { label: string; href: string; active: boolean };

/**
 * Grupo de filtros em pílulas. No celular, uma linha que desliza para o lado
 * (a página em si não rola na horizontal); a partir do tablet, quebra em linhas.
 */
export function FilterChips({ id, label, chips }: { id: string; label: string; chips: Chip[] }) {
  return (
    <nav aria-labelledby={id} className="flex flex-col gap-2.5">
      <p id={id} className="text-xs uppercase tracking-eyebrow text-plum-muted">
        {label}
      </p>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {chips.map((chip) => (
          <li key={chip.href} className="shrink-0">
            <Link
              href={chip.href}
              scroll={false}
              aria-current={chip.active ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-4.5 text-sm whitespace-nowrap transition-colors ${
                chip.active
                  ? "border-plum bg-plum text-cream"
                  : "border-border-strong bg-white text-plum hover:border-plum"
              }`}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
