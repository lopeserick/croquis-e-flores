import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient, rowsOrThrow } from "@/lib/supabase/server";

// Depoimentos: tabela `testimonials`, editável pelo painel.

export type Testimonial = {
  id: string;
  name: string;
  location: string | null;
  text: string;
  /** 1 a 5; null quando o cliente não deu nota. */
  rating: number | null;
  /** Conteúdo de exemplo: nunca aparece no build de produção. */
  demo: boolean;
};

type TestimonialFields = Pick<Tables<"testimonials">, "id" | "name" | "location" | "body" | "rating" | "is_demo">;

export function toTestimonial(row: TestimonialFields): Testimonial {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    text: row.body,
    rating: row.rating,
    demo: row.is_demo,
  };
}

/** Remove os depoimentos de exemplo quando eles não podem aparecer. */
export function visibleTestimonials(
  list: Testimonial[],
  { includeDemo }: { includeDemo: boolean },
): Testimonial[] {
  return includeDemo ? list : list.filter((t) => !t.demo);
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.testimonials);

  const result = await createPublicClient()
    .from("testimonials")
    .select("id, name, location, body, rating, is_demo")
    .eq("published", true)
    .order("sort_order");

  // Em produção a seção some enquanto não houver depoimento real publicado.
  return visibleTestimonials(rowsOrThrow(result, "depoimentos").map(toTestimonial), {
    includeDemo: process.env.NODE_ENV !== "production",
  });
}
