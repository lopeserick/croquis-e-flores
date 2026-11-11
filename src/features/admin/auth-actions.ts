"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withinRateLimit } from "@/lib/security/rate-limit";
import { requestIpHash } from "@/lib/security/request-ip";
import { createSessionClient } from "@/lib/supabase/session";

// Entrar e sair do painel. Mensagens genéricas: não dizem se o e-mail existe.

export type LoginState = { error: string | null; email: string };

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: "Informe o e-mail e a senha.", email };

  if (!(await withinRateLimit("login", await requestIpHash()))) {
    return { error: "Muitas tentativas seguidas. Espere 15 minutos e tente de novo.", email };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "E-mail ou senha incorretos.", email };

  // Conta existe, mas não é da Carla: encerra a sessão na hora.
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao painel.", email };
  }

  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
