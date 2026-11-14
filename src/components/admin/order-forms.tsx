"use client";

import { useActionState, useEffect, useRef } from "react";
import { Feedback, Panel, smallButton } from "@/components/admin/admin-ui";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import {
  addOrderNote,
  resendOrderEmail,
  saveOrderQuote,
  updateOrderStatus,
} from "@/features/admin/order-actions";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/features/admin/order-status";
import { centsToInput } from "@/features/admin/format";

// Formulários da página do pedido. Funcionam também sem JavaScript (form action).

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
