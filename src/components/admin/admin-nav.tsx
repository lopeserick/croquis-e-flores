"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Seções do painel. Obras, catálogo e configurações chegam nas entregas 8 e 9.
const items = [
  { href: "/admin", label: "Início" },
  { href: "/admin/pedidos", label: "Pedidos" },
] as const;

/** Menu com a seção atual destacada. Lê o endereço: fica dentro de <Suspense>. */
export function AdminNav() {
  return <NavLinks pathname={usePathname()} />;
}

/** pathname null: sem destaque (enquanto o endereço não é lido). */
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Painel" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 md:px-4">
      {items.map((item) => {
        const current =
          pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border-b-2 px-3 text-[13px] uppercase tracking-nav ${
              current ? "border-orange-cta text-plum" : "border-transparent text-plum-muted hover:text-plum"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
