import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/session";

// Quem está usando o painel. Toda página, Server Action e rota do painel
// passa por aqui (não basta esconder botões na interface).

export type AdminUser = { id: string; name: string; email: string };

export type AdminSession =
  | { status: "anonimo" }
  | { status: "sem-acesso"; email: string }
  | { status: "admin"; admin: AdminUser };

/** Lê a sessão uma vez por requisição. getUser() confere o token com o Supabase. */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  // Só na hora da requisição: a sessão depende dos cookies e do relógio
  // (validade do token), nunca entra numa página pré-renderizada.
  await connection();
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonimo" };

  // RLS: cada usuário só enxerga o próprio registro em admin_users.
  const { data } = await supabase.from("admin_users").select("name").eq("user_id", user.id).maybeSingle();
  if (!data) return { status: "sem-acesso", email: user.email ?? "" };
  return { status: "admin", admin: { id: user.id, name: data.name, email: user.email ?? "" } };
});

/** Para páginas e Server Actions: devolve o admin ou manda para o login. */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await getAdminSession();
  if (session.status === "admin") return session.admin;
  redirect(session.status === "sem-acesso" ? "/admin/login?acesso=negado" : "/admin/login");
}
