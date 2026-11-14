import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Panel, Pill, smallButton, ListSkeleton } from "@/components/admin/admin-ui";
import { SortableList } from "@/components/admin/sortable-list";
import { getAdminCatalog } from "@/features/admin/catalog";
import { moveCategory, moveModality } from "@/features/admin/catalog-actions";
import { DELIVERY_KIND_LABELS } from "@/features/admin/catalog-rules";
import { formatPrice } from "@/features/catalog/prices";

export const metadata: Metadata = { title: "Catálogo" };

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catálogo"
        description="O que o cliente pode encomendar: modalidades (com tamanhos, técnicas, molduras e preços) e coleções."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Catalog />
      </Suspense>
    </div>
  );
}

async function Catalog() {
  const { modalities, categories, options } = await getAdminCatalog();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Modalidades"
        id="modalidades"
        description="Abra uma modalidade para mudar tamanhos, técnicas, molduras, formatos, entrega e preços."
      >
        <SortableList
          move={moveModality}
          items={modalities.map((m) => ({
            id: m.id,
            name: m.name,
            href: `/admin/catalogo/modalidades/${m.id}`,
            details: `${DELIVERY_KIND_LABELS[m.deliveryKind].split(" (")[0]} · ${options.filter((o) => o.modalityId === m.id && o.active).length} opções ativas`,
            pills: m.active ? [] : [<Pill key="i" tone="warning">Inativa</Pill>],
          }))}
        />
        <Link href="/admin/catalogo/modalidades/nova" className={`${smallButton} self-start no-underline`}>
          Nova modalidade
        </Link>
      </Panel>

      <Panel title="Coleções" id="colecoes" description="Os temas da galeria e da página inicial (Retratos, Casais…).">
        <SortableList
          move={moveCategory}
          items={categories.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/admin/catalogo/colecoes/${c.id}`,
            details: [c.tagline, c.priceCents !== null ? `a partir de ${formatPrice(c.priceCents)}` : ""].filter(Boolean).join(" · "),
            pills: [
              ...(c.active ? [] : [<Pill key="i" tone="warning">Inativa</Pill>]),
              ...(c.active && !c.showOnHome ? [<Pill key="h">Fora da página inicial</Pill>] : []),
              ...(c.image ? [] : [<Pill key="f">Sem foto</Pill>]),
            ],
          }))}
        />
        <Link href="/admin/catalogo/colecoes/nova" className={`${smallButton} self-start no-underline`}>
          Nova coleção
        </Link>
      </Panel>
    </div>
  );
}
