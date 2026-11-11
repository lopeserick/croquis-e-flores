"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref, mainNav } from "@/features/site/navigation";

type MainNavProps = {
  /** Sem pathname (fallback do Suspense) nenhum item fica ativo. */
  withActiveState?: boolean;
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
};

export function MainNav(props: MainNavProps) {
  return props.withActiveState === false ? (
    <NavList {...props} pathname={null} />
  ) : (
    <NavWithPathname {...props} />
  );
}

function NavWithPathname(props: MainNavProps) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

function NavList({
  pathname,
  orientation = "horizontal",
  onNavigate,
}: MainNavProps & { pathname: string | null }) {
  const horizontal = orientation === "horizontal";
  return (
    <ul
      className={
        horizontal
          ? "flex flex-wrap justify-center gap-x-9 gap-y-2"
          : "flex flex-col divide-y divide-border border-y border-border"
      }
    >
      {mainNav.map((item) => {
        const active = pathname !== null && isActiveHref(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={
                horizontal
                  ? `inline-flex min-h-11 items-center border-b-2 text-[13px] uppercase tracking-nav no-underline hover:text-rose ${active ? "border-orange-script" : "border-transparent"}`
                  : `flex min-h-13 items-center text-sm uppercase tracking-nav no-underline hover:text-rose ${active ? "text-rose" : ""}`
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
