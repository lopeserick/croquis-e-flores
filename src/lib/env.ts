import "server-only";
import { z } from "zod";

// Variáveis agrupadas por integração. Cada grupo é validado na primeira vez
// que é usado, assim uma integração ainda não configurada (ex.: e-mail) não
// impede o resto do site de rodar. Documentação de cada variável: .env.example.
const schemas = {
  site: z.object({
    NEXT_PUBLIC_SITE_URL: z.url(),
  }),
  // Leitura pública (sujeita às políticas RLS).
  supabase: z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
  }),
  // Acesso total, ignora o RLS: só em código de servidor que já checou permissão.
  supabaseAdmin: z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
  }),
  email: z.object({
    RESEND_API_KEY: z.string().startsWith("re_"),
    EMAIL_FROM: z.string().min(3),
    // Só em desenvolvimento: sem domínio verificado, o Resend só entrega ao dono da conta.
    EMAIL_TO_OVERRIDE: z.email().optional(),
  }),
  security: z.object({
    CRON_SECRET: z.string().min(32),
    IP_HASH_SALT: z.string().min(32),
  }),
} as const;

export type EnvGroup = keyof typeof schemas;
export type Env<G extends EnvGroup> = z.infer<(typeof schemas)[G]>;

type EnvSource = Record<string, string | undefined>;

export function parseEnv<G extends EnvGroup>(group: G, source: EnvSource): Env<G> {
  const result = schemas[group].safeParse(source);
  if (!result.success) {
    // Só os nomes entram na mensagem: valores podem ser segredos.
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(
      `Variáveis de ambiente ausentes ou inválidas (${group}): ${names.join(", ")}. Veja o .env.example.`,
    );
  }
  return result.data as Env<G>;
}

const cache = new Map<EnvGroup, unknown>();

export function getEnv<G extends EnvGroup>(group: G): Env<G> {
  if (!cache.has(group)) cache.set(group, parseEnv(group, process.env));
  return cache.get(group) as Env<G>;
}
