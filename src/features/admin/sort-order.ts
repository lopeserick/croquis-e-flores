import "server-only";
import { createSessionClient } from "@/lib/supabase/session";

/** Grava a nova ordem 1, 2, 3… (depois de trocar dois itens de lugar). Só atualiza o que mudou. */
export async function saveOrder(
  table: "artworks" | "artwork_images" | "modalities" | "categories" | "options" | "testimonials",
  rows: { id: string; sort_order: number }[],
): Promise<void> {
  const supabase = await createSessionClient();
  for (const [index, row] of rows.entries()) {
    if (row.sort_order !== index + 1) await supabase.from(table).update({ sort_order: index + 1 }).eq("id", row.id);
  }
}
