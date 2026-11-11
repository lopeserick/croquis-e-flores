import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, OrderList } from "@/components/admin/order-list";
import { isOrderStatus, ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/features/admin/order-status";
import { getOrderCounts, listOrders } from "@/features/admin/orders";

export const metadata: Metadata = { title: "Pedidos" };

export default function OrdersPage(props: PageProps<"/admin/pedidos">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-section md:text-section-lg">Pedidos</h1>
      <Suspense fallback={<ListSkeleton />}>
        <Orders searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Orders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = isOrderStatus(params.status) ? params.status : null;
  const emailFailed = params.email === "falhou";
  const [orders, counts] = await Promise.all([listOrders({ status, emailFailed }), getOrderCounts()]);

  const filters: { href: string; label: string; current: boolean }[] = [
    { href: "/admin/pedidos", label: `Todos (${counts.total})`, current: !status && !emailFailed },
    ...ORDER_STATUSES.map((s: OrderStatus) => ({
      href: `/admin/pedidos?status=${s}`,
      label: `${STATUS_LABELS[s]} (${counts.byStatus[s]})`,
      current: status === s,
    })),
    ...(counts.emailFailed > 0 || emailFailed
      ? [{ href: "/admin/pedidos?email=falhou", label: `E-mail não enviado (${counts.emailFailed})`, current: emailFailed }]
      : []),
  ];

  return (
    <>
      <nav aria-label="Filtrar pedidos" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 pb-1 md:flex-wrap">
          {filters.map((f) => (
            <li key={f.href} className="shrink-0">
              <Link
                href={f.href}
                aria-current={f.current ? "true" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap no-underline ${
                  f.current ? "border-plum bg-plum text-cream" : "border-border-strong bg-white hover:border-plum"
                }`}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p role="status" className="text-sm text-plum-muted">
        {orders.length === 1 ? "1 pedido" : `${orders.length} pedidos`}
        {orders.length === 100 && " (os 100 mais recentes)"}
      </p>
      <OrderList
        orders={orders}
        emptyText={status || emailFailed ? "Nenhum pedido neste filtro." : "Ainda não chegou nenhum pedido pelo site."}
      />
    </>
  );
}
