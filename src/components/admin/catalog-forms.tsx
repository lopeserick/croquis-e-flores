"use client";

import { Checkbox, Feedback, Panel, smallButton } from "@/components/admin/admin-ui";
import { FieldError, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { saveCategory, saveModality, saveOption } from "@/features/admin/catalog-actions";
import type { AdminCategory, AdminModality, AdminOption } from "@/features/admin/catalog";
import {
  DELIVERY_KIND_LABELS,
  OPTION_KIND_LABELS,
  OPTION_KIND_SINGULAR,
  OPTION_PRICE_HINTS,
} from "@/features/admin/catalog-rules";
import { centsToInput } from "@/features/admin/order-status";
import type { OptionKind } from "@/features/catalog/types";
import { ImageAssetField } from "./image-asset-field";
import { useFormAction } from "./use-form-action";

function SubmitRow({ pending, label, state }: { pending: boolean; label: string; state: { ok: boolean; message: string } | null }) {
  return (
    <div className="flex flex-col gap-2">
      <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
        {pending ? "Salvando…" : label}
      </button>
      <Feedback state={state} />
    </div>
  );
}

export function ModalityForm({ modality }: { modality: AdminModality | null }) {
  const { state, pending, onSubmit, error } = useFormAction(saveModality);
  return (
    <Panel title={modality ? "Dados da modalidade" : "Nova modalidade"} id="dados-modalidade">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {modality && <input type="hidden" name="id" value={modality.id} />}
        <TextField id="modalidade-nome" name="name" label="Nome" defaultValue={modality?.name} error={error("name")} maxLength={60} />
        {modality ? (
          <p className="text-sm text-plum-muted">Entrega: {DELIVERY_KIND_LABELS[modality.deliveryKind]}</p>
        ) : (
          <SelectField
            id="modalidade-entrega"
            name="deliveryKind"
            label="Como a obra chega ao cliente"
            placeholder="Escolha"
            defaultValue=""
            error={error("deliveryKind")}
          >
            <option value="fisica">{DELIVERY_KIND_LABELS.fisica}</option>
            <option value="digital">{DELIVERY_KIND_LABELS.digital}</option>
          </SelectField>
        )}
        <TextArea
          id="modalidade-descricao"
          name="description"
          label="Descrição"
          optional
          hint='Aparece no configurador e em "Tipos de obra".'
          rows={3}
          defaultValue={modality?.description}
          error={error("description")}
          maxLength={600}
        />
        {modality && (
          <ImageAssetField
            name="image"
            label="Foto de exemplo"
            hint='Mostrada no configurador e em "Tipos de obra".'
            folder="modalidades"
            owner={modality.id}
            initial={modality.image}
            error={error("image")}
          />
        )}
        <Checkbox
          name="active"
          label="Ativa"
          hint="Desativada, some do configurador, de “Tipos de obra” e as obras dela saem da galeria."
          defaultChecked={modality?.active ?? true}
        />
        <SubmitRow pending={pending} state={state} label={modality ? "Salvar modalidade" : "Criar modalidade"} />
      </form>
    </Panel>
  );
}

export function CategoryForm({
  category,
  modalities,
}: {
  category: AdminCategory | null;
  modalities: Pick<AdminModality, "id" | "name" | "active">[];
}) {
  const { state, pending, onSubmit, error } = useFormAction(saveCategory);
  return (
    <Panel title={category ? "Dados da coleção" : "Nova coleção"} id="dados-colecao">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {category && <input type="hidden" name="id" value={category.id} />}
        <TextField id="colecao-nome" name="name" label="Nome" defaultValue={category?.name} error={error("name")} maxLength={60} />
        <TextField
          id="colecao-frase"
          name="tagline"
          label="Frase curta"
          optional
          hint="Aparece embaixo do nome, na página inicial."
          defaultValue={category?.tagline}
          error={error("tagline")}
          maxLength={140}
        />
        <TextField
          id="colecao-preco"
          name="priceCents"
          label="Preço próprio (R$)"
          optional
          hint='Só para coleções com preço diferente (ex.: Desenho técnico de moda). Aparece como "a partir de".'
          inputMode="decimal"
          autoComplete="off"
          defaultValue={centsToInput(category?.priceCents ?? null)}
          error={error("priceCents")}
        />
        <fieldset className="flex flex-col gap-1" aria-describedby="colecao-modalidades-dica">
          <legend className="text-[15px] font-medium">Em quais modalidades pode ser encomendada</legend>
          <p id="colecao-modalidades-dica" className="text-sm text-plum-muted">
            No configurador, a coleção aparece como “tipo de arte” só nas modalidades marcadas.
          </p>
          {modalities.map((m) => (
            <Checkbox
              key={m.id}
              name="modalityIds"
              value={m.id}
              label={`${m.name}${m.active ? "" : " (inativa)"}`}
              defaultChecked={category?.modalityIds.includes(m.id) ?? true}
            />
          ))}
          <FieldError id="colecao-modalidades" error={error("modalityIds")} />
        </fieldset>
        {category && (
          <ImageAssetField
            name="image"
            label="Foto da coleção"
            hint="Aparece no círculo da página inicial e na prévia do link da coleção."
            folder="colecoes"
            owner={category.id}
            initial={category.image}
            error={error("image")}
          />
        )}
        <TextField
          id="colecao-endereco"
          name="slug"
          label="Endereço da página"
          optional
          hint={
            category
              ? `Hoje: /galeria/${category.slug}. Se mudar, links já compartilhados param de funcionar.`
              : "Deixe em branco: é criado a partir do nome."
          }
          defaultValue={category?.slug}
          error={error("slug")}
          maxLength={60}
          autoComplete="off"
          autoCapitalize="none"
        />
        <Checkbox name="showOnHome" label="Mostrar na página inicial" defaultChecked={category?.showOnHome ?? true} />
        <Checkbox
          name="active"
          label="Ativa"
          hint="Desativada, some do site (galeria, configurador) e as obras dela saem da galeria."
          defaultChecked={category?.active ?? true}
        />
        <SubmitRow pending={pending} state={state} label={category ? "Salvar coleção" : "Criar coleção"} />
      </form>
    </Panel>
  );
}

export function OptionForm({
  option,
  modality,
  kind,
  siblings,
}: {
  option: AdminOption | null;
  modality: Pick<AdminModality, "id" | "name">;
  kind: OptionKind;
  /** Outras opções da mesma modalidade (para "só aparece com"). */
  siblings: AdminOption[];
}) {
  const { state, pending, onSubmit, error } = useFormAction(saveOption);
  const others = siblings.filter((o) => o.kind !== kind && o.id !== option?.id);
  const title = option ? `${OPTION_KIND_SINGULAR[kind][0].toUpperCase()}${OPTION_KIND_SINGULAR[kind].slice(1)}` : `Nova opção: ${OPTION_KIND_SINGULAR[kind]}`;

  return (
    <Panel title={title} id="dados-opcao" description={`${modality.name} · ${OPTION_KIND_LABELS[kind]}`}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {option ? (
          <input type="hidden" name="id" value={option.id} />
        ) : (
          <>
            <input type="hidden" name="modalityId" value={modality.id} />
            <input type="hidden" name="kind" value={kind} />
          </>
        )}
        <TextField id="opcao-nome" name="label" label="Nome" defaultValue={option?.label} error={error("label")} maxLength={80} />
        <TextArea
          id="opcao-descricao"
          name="description"
          label="Descrição"
          optional
          hint="Aparece em letras menores (ex.: “Sem taxa de entrega”)."
          rows={2}
          defaultValue={option?.description}
          error={error("description")}
          maxLength={300}
        />
        <TextField
          id="opcao-preco"
          name="priceCents"
          label="Preço (R$)"
          optional
          hint={OPTION_PRICE_HINTS[kind]}
          inputMode="decimal"
          autoComplete="off"
          defaultValue={centsToInput(option?.priceCents ?? null)}
          error={error("priceCents")}
        />
        {others.length > 0 && (
          <fieldset className="flex flex-col gap-1" aria-describedby="opcao-requer-dica">
            <legend className="text-[15px] font-medium">Só aparece quando o cliente escolher</legend>
            <p id="opcao-requer-dica" className="text-sm text-plum-muted">
              Deixe tudo desmarcado para aparecer sempre. Ex.: “Nanquim” só com o tamanho “Folha A4”.
            </p>
            {others.map((o) => (
              <Checkbox
                key={o.id}
                name="requiresOptionIds"
                value={o.id}
                label={`${o.label} (${OPTION_KIND_SINGULAR[o.kind]}${o.active ? "" : ", inativa"})`}
                defaultChecked={option?.requiresOptionIds.includes(o.id) ?? false}
              />
            ))}
            <FieldError id="opcao-requer" error={error("requiresOptionIds")} />
          </fieldset>
        )}
        <Checkbox
          name="allowsCustom"
          label="Abre um campo para o cliente escrever"
          hint="Para opções como “Outra técnica” ou “Tamanho personalizado”."
          defaultChecked={option?.allowsCustom ?? false}
        />
        <Checkbox
          name="active"
          label="Ativa"
          hint="Desativada, some do configurador e da tabela de preços. Pedidos antigos continuam com o nome dela."
          defaultChecked={option?.active ?? true}
        />
        <SubmitRow pending={pending} state={state} label={option ? "Salvar opção" : "Criar opção"} />
      </form>
    </Panel>
  );
}
