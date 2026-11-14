import Link from "next/link";
import { EMAIL_LABELS, STATUS_LABELS, type EmailStatus, type OrderStatus } from "@/features/admin/order-status";
import { formatDateTime } from "@/features/admin/format";
import type { OrderListItem } from "@/features/admin/orders";

// Cores com contraste de texto 4,5:1 sobre o fundo de cada etiqueta.
const statusTone: Record<OrderStatus, string> = {
  novo: "bg-orange-cta text-white",
  orcamento_enviado: "bg-peach-soft text-plum",
  aprovado: "bg-plum text-cream",
  concluido: "border border-border-strong bg-white text-plum",
  cancelado: "border border-border-strong bg-white text-plum-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusTone[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function EmailAlert({ status }: { status: EmailStatus }) {
  if (status !== "falhou") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose px-3 py-1 text-xs text-rose">
      <span aria-hidden="true">!</span>
      {EMAIL_LABELS.falhou}
    </span>
  );
}

export function OrderList({ orders, emptyText }: { orders: OrderListItem[]; emptyText: string }) {
  if (orders.length === 0) {
    return <p className="rounded-card border border-border bg-white p-6 text-plum-muted">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="flex flex-col gap-2 rounded-card border border-border bg-white p-4 no-underline transition-colors hover:border-plum md:flex-row md:items-center md:justify-between md:p-5"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium">{order.number}</span>
                <span className="font-serif text-xl leading-tight">{order.customerName}</span>
              </span>
              <span className="text-sm text-plum-muted">
                {order.headline && <>{order.headline} · </>}
                {order.city}/{order.state} · {formatDateTime(order.createdAt)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <EmailAlert status={order.emailStatus} />
              <StatusBadge status={order.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
