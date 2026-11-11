import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { NoteForm, QuoteForm, ResendEmailForm, StatusForm } from "@/components/admin/order-forms";
import { EmailAlert, ListSkeleton, StatusBadge } from "@/components/admin/order-list";
import {
  EMAIL_LABELS,
  formatDateTime,
  STATUS_LABELS,
} from "@/features/admin/order-status";
import { getOrderDetail, type OrderDetail, type OrderEvent } from "@/features/admin/orders";
import { formatLongDate } from "@/features/orders/dates";
import { formatBrPhone } from "@/features/orders/phone";
import { formatFileSize } from "@/features/orders/references";
import { artistToCustomerLink } from "@/features/orders/whatsapp";

export const metadata: Metadata = { title: "Pedido" };

export default function OrderPage(props: PageProps<"/admin/pedidos/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4">
        <span aria-hidden="true">←&nbsp;</span>Todos os pedidos
      </Link>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Order params={props.params} />
      </Suspense>
    </div>
  );
}

async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-sm text-plum-muted">
          <span className="font-medium text-plum">{order.number}</span>
          <span>· recebido em {formatDateTime(order.createdAt)}</span>
        </p>
        <h1 className="font-serif text-section leading-tight md:text-section-lg">{order.customerName}</h1>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <EmailAlert status={order.emailStatus} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Card title="A obra" id="obra">
            <Rows rows={[...order.summary.work, ...order.summary.details]} />
            {order.inspiration && (
              <p className="text-sm">
                Inspirada na obra{" "}
                <Link href={`/obra/${order.inspiration.slug}`} target="_blank" className="underline underline-offset-4">
                  {order.inspiration.title}
                  <span className="sr-only"> (abre em nova aba)</span>
                </Link>
              </p>
            )}
          </Card>

          <Card title="Inspiração" id="inspiracao">
            <Rows
              rows={[
                ["Data desejada", order.desiredDate ? formatLongDate(order.desiredDate) : "Não informada"],
                ["Descrição", order.description],
              ]}
            />
            <References order={order} />
          </Card>

          <Card title="Cliente" id="cliente">
            <Rows
              rows={[
                ["Nome", order.customerName],
                ["Cidade", `${order.city} / ${order.state}`],
                ...(order.notes ? [["Observações", order.notes] as [string, string]] : []),
                ["Portfólio", order.portfolioConsent ? "Autorizou mostrar a obra pronta" : "Não autorizou"],
                [
                  "Privacidade",
                  `Aceitou a política (versão ${order.privacyVersion}) em ${formatDateTime(order.privacyAcceptedAt)}`,
                ],
              ]}
            />
            <div className="flex flex-wrap gap-3">
              <a
                href={artistToCustomerLink(`55${order.customerWhatsapp}`, order.number, order.customerName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-orange-cta px-5 text-xs uppercase tracking-button text-white hover:bg-plum"
              >
                WhatsApp {formatBrPhone(order.customerWhatsapp)}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              <a
                href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Seu pedido ${order.number}`)}`}
                className="inline-flex min-h-11 items-center rounded-full border border-plum px-5 text-xs tracking-button hover:bg-plum hover:text-cream"
              >
                {order.customerEmail}
              </a>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <StatusForm orderId={order.id} status={order.status} />
          <QuoteForm orderId={order.id} quoteCents={order.quoteCents} deadline={order.confirmedDeadline} />
          <NoteForm orderId={order.id} />
          <Card title="E-mail de aviso" id="email">
            <p className="text-[15px]">{EMAIL_LABELS[order.emailStatus]}.</p>
            {order.emailStatus !== "enviado" && <ResendEmailForm orderId={order.id} />}
          </Card>
          <Card title="Histórico" id="historico">
            <History events={order.events} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 md:p-6">
      <h2 id={id} className="font-serif text-2xl leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[minmax(0,9rem)_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-plum-muted">{label}</dt>
          <dd className="mb-2 break-words whitespace-pre-line sm:mb-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Fotos do cliente: abrem por uma rota do painel que gera um link de 1 minuto. */
function References({ order }: { order: OrderDetail }) {
  if (order.references.length === 0) return <p className="text-[15px] text-plum-muted">Sem fotos de referência.</p>;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[15px] font-medium">
        {order.references.length === 1 ? "1 foto de referência" : `${order.references.length} fotos de referência`}
      </h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {order.references.map((ref, index) => (
          <li key={ref.id} className="flex flex-col gap-1.5">
            <a
              href={`/api/admin/referencias/${ref.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-xl bg-blush"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arquivo privado, via link assinado curto */}
              <img
                src={`/api/admin/referencias/${ref.id}`}
                alt={`Foto de referência ${index + 1}: ${ref.name} (abrir em tamanho real)`}
                loading="lazy"
                className="size-full object-cover"
              />
            </a>
            <span className="truncate text-xs text-plum-muted" title={ref.name}>
              {ref.name} · {formatFileSize(ref.sizeBytes)}
            </span>
            <a
              href={`/api/admin/referencias/${ref.id}?baixar=1`}
              className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4"
            >
              Baixar<span className="sr-only"> {ref.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function eventText(event: OrderEvent): string {
  switch (event.type) {
    case "criado":
      return event.body ?? "Pedido criado.";
    case "status":
      return `Status: ${event.fromStatus ? STATUS_LABELS[event.fromStatus] : "?"} → ${
        event.toStatus ? STATUS_LABELS[event.toStatus] : "?"
      }`;
    case "email_falhou":
      return `E-mail não enviado. ${event.body ?? ""}`.trim();
    default:
      return event.body ?? "";
  }
}

function History({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 border-l-2 border-blush pl-3">
          <span className="text-xs text-plum-muted">
            {formatDateTime(event.createdAt)} · {event.byAdmin ? "pelo painel" : "pelo site"}
          </span>
          <span className="text-[15px] break-words whitespace-pre-line">{eventText(event)}</span>
        </li>
      ))}
    </ol>
  );
}
