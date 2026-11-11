import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Limite de tentativas por IP (hash), contado no Postgres (hit_rate_limit).

export const RATE_LIMITS = {
  /** Pedidos enviados. */
  pedido: { windowSeconds: 3600, max: 10 },
  /** Pedidos de links para enviar fotos. */
  upload: { windowSeconds: 3600, max: 30 },
  /** Tentativas de login no painel. */
  login: { windowSeconds: 900, max: 10 },
} as const;

export async function withinRateLimit(name: keyof typeof RATE_LIMITS, ipHash: string): Promise<boolean> {
  const { windowSeconds, max } = RATE_LIMITS[name];
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: `${name}:${ipHash}`,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) throw new Error(`Falha ao conferir o limite de tentativas: ${error.message}`);
  return data === true;
}
