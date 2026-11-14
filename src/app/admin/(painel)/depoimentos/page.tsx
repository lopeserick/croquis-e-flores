import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Panel, Pill, smallButton, ListSkeleton } from "@/components/admin/admin-ui";
import { SortableList } from "@/components/admin/sortable-list";
import { listAdminTestimonials } from "@/features/admin/content";
import { moveTestimonial } from "@/features/admin/content-actions";

export const metadata: Metadata = { title: "Depoimentos" };

export default function TestimonialsPage(props: PageProps<"/admin/depoimentos">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Depoimentos"
        description="Aparecem no carrossel da página inicial, nesta ordem. Só os publicados vão para o site."
        action={
          <Link href="/admin/depoimentos/novo" className={`${smallButton} no-underline`}>
            Novo depoimento
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <Testimonials searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Testimonials({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [query, testimonials] = await Promise.all([searchParams, listAdminTestimonials()]);
  const excerpt = (text: string) => (text.length > 90 ? `${text.slice(0, 90).trimEnd()}…` : text);

  return (
    <>
      {(query.salvo === "1" || query.apagado === "1") && (
        <p role="status" className="rounded-xl bg-cream p-4 text-sm">
          {query.salvo === "1" ? "Depoimento criado." : "Depoimento apagado."}
        </p>
      )}
      <Panel title={`${testimonials.length} depoimentos`} id="lista-depoimentos">
        <SortableList
          move={moveTestimonial}
          items={testimonials.map((t) => ({
            id: t.id,
            name: `“${excerpt(t.body)}”`,
            href: `/admin/depoimentos/${t.id}`,
            details: [t.name, t.location].filter(Boolean).join(" · "),
            pills: [
              t.published ? <Pill key="p" tone="strong">Publicado</Pill> : <Pill key="p">Não publicado</Pill>,
              ...(t.isDemo ? [<Pill key="d" tone="warning">Exemplo</Pill>] : []),
            ],
          }))}
        />
      </Panel>
    </>
  );
}
