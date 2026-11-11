import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Cliente com a sessão de quem está logado (cookies do painel). Usa a chave
 * pública: o banco aplica o RLS com o usuário da sessão, então mesmo um erro
 * no código do painel não entrega pedidos a quem não é admin.
 */
export async function createSessionClient() {
  const env = getEnv("supabase");
  const store = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Em Server Components os cookies são só leitura: o proxy renova a sessão.
        }
      },
    },
  });
}
