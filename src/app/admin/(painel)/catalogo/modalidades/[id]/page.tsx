import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Panel, Pill, ListSkeleton } from "@/components/admin/admin-ui";
import { ModalityForm } from "@/components/admin/catalog-forms";
import { SortableList } from "@/components/admin/sortable-list";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminCatalog } from "@/features/admin/catalog";
import { moveOption } from "@/features/admin/catalog-actions";
import { OPTION_KIND_LABELS, OPTION_KIND_SINGULAR, OPTION_KINDS } from "@/features/admin/catalog-rules";
import { optionPriceLabel } from "@/features/catalog/prices";

export const metadata: Metadata = { title: "Modalidade" };

export default function ModalityPage(props: PageProps<"/admin/catalogo/modalidades/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/catalogo">Catálogo</BackLink>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Modality params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Modality({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireAdmin();
  if (id === "nova") {
    return (
      <>
        <h1 className="font-serif text-section leading-tight md:text-section-lg">Nova modalidade</h1>
        <ModalityForm modality={null} />
      </>
    );
  }

  const catalog = await getAdminCatalog();
  const modality = catalog.modalities.find((m) => m.id === id);
  if (!modality) notFound();
  const options = catalog.options.filter((o) => o.modalityId === modality.id);
  const label = (optionId: string) => options.find((o) => o.id === optionId)?.label ?? "";

  return (
    <>
      <h1 className="font-serif text-section leading-tight md:text-section-lg">{modality.name}</h1>
      {query.criada === "1" && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          Modalidade criada. Agora cadastre os tamanhos e as demais opções.
        </p>
      )}
      {query.opcao === "criada" && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          Opção criada.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ModalityForm modality={modality} />
        <Panel
          title="Opções de encomenda"
          id="opcoes"
          description="Os grupos aparecem no configurador nesta ordem. Grupo sem opção ativa não aparece."
        >
          {OPTION_KINDS.map((kind) => {
            const list = options.filter((o) => o.kind === kind);
            return (
              <section key={kind} aria-labelledby={`grupo-${kind}`} className="flex flex-col gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <h3 id={`grupo-${kind}`} className="font-medium">
                  {OPTION_KIND_LABELS[kind]}
                </h3>
                <SortableList
                  move={moveOption}
                  items={list.map((o) => ({
                    id: o.id,
                    name: o.label,
                    href: `/admin/catalogo/opcoes/${o.id}`,
                    details: [
                      optionPriceLabel(o) ?? "",
                      o.requiresOptionIds.length > 0 ? `só com: ${o.requiresOptionIds.map(label).join(", ")}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    pills: o.active ? [] : [<Pill key="i" tone="warning">Inativa</Pill>],
                  }))}
                />
                <Link
                  href={`/admin/catalogo/opcoes/nova?modalidade=${modality.id}&tipo=${kind}`}
                  className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4"
                >
                  + Nova opção: {OPTION_KIND_SINGULAR[kind]}
                </Link>
              </section>
            );
          })}
        </Panel>
      </div>
    </>
  );
}
