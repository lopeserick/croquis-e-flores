import Link from "next/link";
import { Suspense } from "react";
import { LogoSymbol } from "@/components/site/logo";
import { getAdminSession } from "@/features/admin/auth";
import { signOut } from "@/features/admin/auth-actions";
import { AdminNav, NavLinks } from "./admin-nav";

export function AdminHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <Link href="/admin" className="flex min-h-11 items-center gap-2.5 no-underline">
          <LogoSymbol className="h-10 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-xl">Croquis e Flores</span>
            <span className="text-xs uppercase tracking-eyebrow text-rose">Painel</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" target="_blank" className="inline-flex min-h-11 items-center underline underline-offset-4">
            Ver o site<span className="sr-only"> (abre em nova aba)</span>
          </Link>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<NavLinks pathname={null} />}>
        <AdminNav />
      </Suspense>
    </header>
  );
}

async function UserMenu() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden text-plum-muted sm:inline">{session.admin.name}</span>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-full border border-plum px-4 hover:bg-plum hover:text-cream"
      >
        Sair
      </button>
    </form>
  );
}
