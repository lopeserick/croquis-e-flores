import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/session";
import { requireAdmin } from "./auth";

// Leituras do painel de conteúdo: depoimentos (todos, inclusive não
// publicados) e configurações, com a sessão da Carla (RLS). Sem cache.

export type AdminTestimonial = {
  id: string;
  name: string;
  location: string;
  body: string;
  rating: number | null;
  consentNote: string;
  published: boolean;
  isDemo: boolean;
  sortOrder: number;
};

export async function listAdminTestimonials(): Promise<AdminTestimonial[]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("testimonials").select("*").order("sort_order").order("created_at");
  if (error) throw new Error(`Falha ao carregar os depoimentos: ${error.message}`);
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location ?? "",
    body: t.body,
    rating: t.rating,
    consentNote: t.consent_note,
    published: t.published,
    isDemo: t.is_demo,
    sortOrder: t.sort_order,
  }));
}

/** Valor atual de cada chave de configuração (como está no banco). */
export async function getAdminSettings(): Promise<Record<string, Json>> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw new Error(`Falha ao carregar as configurações: ${error.message}`);
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}
