import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import type { cacheTags } from "@/lib/cache-tags";

/**
 * Chamar no fim de toda Server Action do painel que muda o que o site mostra.
 *
 * - updateTag: os dados em cache (catálogo, configurações, depoimentos) são
 *   lidos de novo na próxima visita.
 * - revalidatePath("/", "layout"): as páginas já prontas também são refeitas.
 *   Só com a etiqueta, a primeira visita depois da mudança ainda recebia a
 *   página antiga (Next 16.4, `next start`), e a Carla veria a obra recém
 *   publicada "sumida" ao clicar em "Ver no site".
 *
 * Também atualiza a tela do painel que fez a mudança.
 */
export function siteContentChanged(...tags: (typeof cacheTags)[keyof typeof cacheTags][]) {
  for (const tag of tags) updateTag(tag);
  revalidatePath("/", "layout");
}
