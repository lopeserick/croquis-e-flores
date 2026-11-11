"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import {
  addOrderNote,
  resendOrderEmail,
  saveOrderQuote,
  updateOrderStatus,
  type ActionState,
} from "@/features/admin/order-actions";
import { centsToInput, ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/features/admin/order-status";

// Formulários da página do pedido. Funcionam também sem JavaScript (form action).

const smallButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-plum px-5 text-xs uppercase tracking-button text-cream hover:bg-orange-cta disabled:cursor-wait disabled:opacity-70";

function Feedback({ state }: { state: ActionState }) {
  return (
    <p role="status" className={state ? (state.ok ? "text-sm text-plum" : "text-sm text-rose") : "sr-only"}>
      {state?.message ?? ""}
    </p>
  );
}

function Panel({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
      <h2 id={id} className="font-serif text-2xl leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function StatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  return (
    <Panel title="Andamento" id="andamento">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <SelectField id="status" name="status" label="Status do pedido" placeholder="Escolha" defaultValue={status}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
        <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
          {pending ? "Salvando…" : "Salvar status"}
        </button>
        <Feedback state={state} />
      </form>
    </Panel>
  );
}

export function QuoteForm({
  orderId,
  quoteCents,
  deadline,
}: {
  orderId: string;
  quoteCents: number | null;
  deadline: string | null;
}) {
  const [state, action, pending] = useActionState(saveOrderQuote, null);
  return (
    <Panel title="Orçamento e prazo" id="orcamento">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="orderId" value={orderId} />
        <TextField
          id="valor"
          name="quote"
          label="Valor do orçamento (R$)"
          hint="Ex.: 150,00. Fica só no painel; o cliente não vê."
          inputMode="decimal"
          autoComplete="off"
          defaultValue={centsToInput(quoteCents)}
        />
        <TextField id="prazo" name="deadline" label="Prazo confirmado" type="date" defaultValue={deadline ?? ""} />
        <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <Feedback state={state} />
      </form>
    </Panel>
  );
}

export function NoteForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(addOrderNote, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  return (
    <Panel title="Anotação" id="anotacao">
      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <TextArea
          id="nota"
          name="note"
          label="Anotação interna"
          hint="Só você vê. Fica no histórico do pedido."
          rows={3}
          maxLength={2000}
        />
        <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
          {pending ? "Salvando…" : "Salvar anotação"}
        </button>
        <Feedback state={state} />
      </form>
    </Panel>
  );
}

export function ResendEmailForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(resendOrderEmail, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
        {pending ? "Enviando…" : "Reenviar e-mail"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
