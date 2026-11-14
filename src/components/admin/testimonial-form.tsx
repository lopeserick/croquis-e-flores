"use client";

import { Checkbox, dangerButton, Feedback, Panel, smallButton } from "@/components/admin/admin-ui";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import type { AdminTestimonial } from "@/features/admin/content";
import { deleteTestimonial, saveTestimonial } from "@/features/admin/content-actions";
import { useFormAction } from "./use-form-action";

export function TestimonialForm({ testimonial }: { testimonial: AdminTestimonial | null }) {
  const { state, pending, onSubmit, error } = useFormAction(saveTestimonial);
  return (
    <Panel title={testimonial ? "Depoimento" : "Novo depoimento"} id="dados-depoimento">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {testimonial && <input type="hidden" name="id" value={testimonial.id} />}
        <TextArea
          id="depoimento-texto"
          name="body"
          label="Depoimento"
          hint="Exatamente como o cliente escreveu."
          rows={4}
          defaultValue={testimonial?.body}
          error={error("body")}
          maxLength={600}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            id="depoimento-nome"
            name="name"
            label="Nome que aparece"
            hint="Sem autorização para mostrar o nome, use “Cliente Croquis e Flores”."
            defaultValue={testimonial?.name ?? "Cliente Croquis e Flores"}
            error={error("name")}
            maxLength={80}
          />
          <TextField
            id="depoimento-cidade"
            name="location"
            label="Cidade"
            optional
            hint="Ex.: Feira de Santana, BA"
            defaultValue={testimonial?.location}
            error={error("location")}
            maxLength={80}
          />
        </div>
        <SelectField
          id="depoimento-nota"
          name="rating"
          label="Nota"
          optional
          placeholder="Sem nota"
          defaultValue={testimonial?.rating?.toString() ?? ""}
          error={error("rating")}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "estrela" : "estrelas"}
            </option>
          ))}
        </SelectField>
        <TextArea
          id="depoimento-autorizacao"
          name="consentNote"
          label="Autorização do cliente"
          hint="Como e quando o cliente autorizou a publicação (ex.: “Pesquisa de satisfação, out/2026”). Obrigatório para publicar."
          rows={2}
          defaultValue={testimonial?.consentNote}
          error={error("consentNote")}
          maxLength={300}
        />
        <Checkbox name="published" label="Publicar no site" defaultChecked={testimonial?.published ?? false} />
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
            {pending ? "Salvando…" : testimonial ? "Salvar depoimento" : "Criar depoimento"}
          </button>
          <Feedback state={state} />
        </div>
      </form>
      {testimonial && <DeleteTestimonial id={testimonial.id} />}
    </Panel>
  );
}

function DeleteTestimonial({ id }: { id: string }) {
  const remove = useFormAction(deleteTestimonial);
  return (
    <form
      onSubmit={(event) => {
        if (!window.confirm("Apagar este depoimento? Não dá para desfazer.")) {
          event.preventDefault();
          return;
        }
        remove.onSubmit(event);
      }}
      className="flex flex-col gap-2 border-t border-border pt-4"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={remove.pending} className={`${dangerButton} self-start`}>
        Apagar depoimento
      </button>
      <Feedback state={remove.state} />
    </form>
  );
}
