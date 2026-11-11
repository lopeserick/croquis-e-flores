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
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-12 lg:grid-cols-4 lg:gap-8">
          {categories.map((category) => (
            <li key={category.id}>
              <CollectionCircle category={category} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
