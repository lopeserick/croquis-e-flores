import "server-only";
import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

// Só o servidor fala com o banco: o navegador não carrega o SDK do Supabase
// (docs/arquitetura.md, seção 4).

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

/** Leitura do site público, com a chave pública: vale o RLS (só o que é publicado). */
export function createPublicClient() {
  const env = getEnv("supabase");
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: noSession,
  });
}

/**
 * Acesso total, ignora o RLS. Use só depois de checar a permissão no servidor
 * (pedido do cliente validado, admin logado). Nunca em resposta direta a quem pede.
 */
export function createAdminClient() {
  const env = getEnv("supabaseAdmin");
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: noSession,
  });
}

/** Devolve as linhas da consulta ou lança um erro que diz o que falhou. */
export function rowsOrThrow<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  what: string,
): T[] {
  if (result.error) throw new Error(`Falha ao carregar ${what}: ${result.error.message}`);
  return result.data ?? [];
}
