import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, OrderList } from "@/components/admin/order-list";
import { requireAdmin } from "@/features/admin/auth";
import { ORDER_STATUSES, STATUS_LABELS } from "@/features/admin/order-status";
import { getOrderCounts, listOrders } from "@/features/admin/orders";

export const metadata: Metadata = { title: "Início" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  const [counts, recent] = await Promise.all([
    getOrderCounts(),
    listOrders({ status: null, emailFailed: false }, 5),
  ]);
  const firstName = admin.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-section md:text-section-lg">Olá, {firstName}!</h1>
        <p className="text-plum-muted">
          {counts.byStatus.novo === 0
            ? "Nenhum pedido novo esperando por você."
            : counts.byStatus.novo === 1
              ? "Você tem 1 pedido novo."
              : `Você tem ${counts.byStatus.novo} pedidos novos.`}
        </p>
      </div>

      {counts.emailFailed > 0 && (
        <div role="alert" className="flex flex-col gap-2 rounded-card border-2 border-rose bg-white p-5">
          <p className="font-medium">
            {counts.emailFailed === 1
              ? "1 pedido não gerou o e-mail de aviso."
              : `${counts.emailFailed} pedidos não geraram o e-mail de aviso.`}
          </p>
          <p className="text-sm text-plum-muted">
            Eles estão salvos aqui no painel. Abra cada um para ver os dados e, se quiser, reenviar o e-mail.
          </p>
          <Link
            href="/admin/pedidos?email=falhou"
            className="inline-flex min-h-11 items-center self-start underline underline-offset-4"
          >
            Ver esses pedidos
          </Link>
        </div>
      )}

      <section aria-labelledby="por-status" className="flex flex-col gap-4">
        <h2 id="por-status" className="font-serif text-3xl">
          Pedidos por status
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ORDER_STATUSES.map((status) => (
            <li key={status}>
              <Link
                href={`/admin/pedidos?status=${status}`}
                className="flex min-h-24 flex-col justify-between gap-2 rounded-card border border-border bg-white p-4 no-underline hover:border-plum"
              >
                <span className="text-sm text-plum-muted">{STATUS_LABELS[status]}</span>
                <span className="font-serif text-4xl leading-none">{counts.byStatus[status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recentes" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recentes" className="font-serif text-3xl">
            Pedidos recentes
          </h2>
          <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
            Ver todos ({counts.total})
          </Link>
        </div>
        <OrderList orders={recent} emptyText="Ainda não chegou nenhum pedido pelo site." />
      </section>
    </div>
  );
}
