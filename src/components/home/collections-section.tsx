import { CollectionCircle } from "@/components/site/collection-circle";
import { Container, ScriptLine, SectionTitle } from "@/components/ui/layout";
import type { CategoryRow } from "@/features/catalog/types";

export function CollectionsSection({ categories }: { categories: CategoryRow[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="colecoes-titulo" className="bg-cream py-16 md:py-22">
      <Container className="text-center">
        <ScriptLine className="text-orange-script">escolha seu tema</ScriptLine>
        <SectionTitle id="colecoes-titulo" className="mt-1">
          Nossas coleções
        </SectionTitle>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-10 md:mt-12 lg:flex-nowrap lg:gap-6">
          {categories.map((category) => (
            <li key={category.id} className="w-[calc(50%-0.5rem)] sm:w-auto">
              <CollectionCircle category={category} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
