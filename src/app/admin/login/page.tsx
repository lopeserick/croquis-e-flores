import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { LogoSymbol } from "@/components/site/logo";
import { getAdminSession } from "@/features/admin/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSymbol className="h-20 w-auto" />
          <h1 className="font-serif text-4xl">Painel da artista</h1>
          <p className="text-plum-muted">Entre com o e-mail e a senha do painel.</p>
        </div>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-card bg-blush motion-reduce:animate-none" />}>
          <LoginArea searchParams={props.searchParams} />
        </Suspense>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center text-sm underline underline-offset-4">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}

/** Quem já está logado vai direto para o painel. */
async function LoginArea({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAdminSession();
  if (session.status === "admin") redirect("/admin");
  const { acesso } = await searchParams;
  const notice =
    acesso === "negado" || session.status === "sem-acesso" ? "Esta conta não tem acesso ao painel." : null;
  return <LoginForm notice={notice} />;
}
