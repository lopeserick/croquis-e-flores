import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, ListSkeleton } from "@/components/admin/admin-ui";
import { OptionForm } from "@/components/admin/catalog-forms";
import { getAdminCatalog } from "@/features/admin/catalog";
import { isOptionKind } from "@/features/admin/catalog-rules";

export const metadata: Metadata = { title: "Opção de encomenda" };

export default function OptionPage(props: PageProps<"/admin/catalogo/opcoes/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <Option params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Option({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const catalog = await getAdminCatalog();

  const option = id === "nova" ? null : catalog.options.find((o) => o.id === id);
  if (option === undefined) notFound();
  const modalityId = option?.modalityId ?? query.modalidade;
  const kind = option?.kind ?? query.tipo;
  const modality = catalog.modalities.find((m) => m.id === modalityId);
  if (!modality || !isOptionKind(kind)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={`/admin/catalogo/modalidades/${modality.id}`}>{modality.name}</BackLink>
      <h1 className="font-serif text-section leading-tight md:text-section-lg">{option?.label ?? "Nova opção"}</h1>
      <div className="max-w-3xl">
        <OptionForm
          option={option}
          modality={modality}
          kind={kind}
          siblings={catalog.options.filter((o) => o.modalityId === modality.id)}
        />
      </div>
    </div>
  );
}
