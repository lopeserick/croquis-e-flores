import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/catalog-forms";
import { ListSkeleton } from "@/components/admin/order-list";
import { getAdminCatalog } from "@/features/admin/catalog";

export const metadata: Metadata = { title: "Coleção" };

export default function CategoryPage(props: PageProps<"/admin/catalogo/colecoes/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/catalogo">Catálogo</BackLink>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Category params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const catalog = await getAdminCatalog();
  const modalities = catalog.modalities.map(({ id, name, active }) => ({ id, name, active }));
  const category = id === "nova" ? null : catalog.categories.find((c) => c.id === id);
  if (category === undefined) notFound();

  return (
    <>
      <h1 className="font-serif text-section leading-tight md:text-section-lg">{category?.name ?? "Nova coleção"}</h1>
      {query.criada === "1" && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          Coleção criada. Se quiser, envie a foto dela.
        </p>
      )}
      <div className="max-w-3xl">
        <CategoryForm category={category} modalities={modalities} />
      </div>
    </>
  );
}
