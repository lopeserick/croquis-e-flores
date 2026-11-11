import Image from "next/image";
import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { focalPosition } from "@/components/site/artwork-card";
import { formatPrice, optionPriceLabel, startingPrice } from "@/features/catalog/prices";
import type { OptionKind } from "@/features/catalog/types";
import { BR_STATES } from "@/features/orders/br-states";
import { formatLongDate } from "@/features/orders/dates";
import { CUSTOM_CATEGORY } from "@/features/orders/form-types";
import { formatBrPhone, phoneInputDigits } from "@/features/orders/phone";
import {
  availableOptions,
  categoriesFor,
  CUSTOM_FIELDS,
  findModality,
  LIMITS,
  maxDesiredDate,
  minDesiredDate,
  OPTION_FIELDS,
  type FieldErrors,
  type OrderDraft,
  type StepNumber,
  type ValidationContext,
} from "@/features/orders/schema";
import { CheckboxField, ChoiceGroup, SelectField, TextArea, TextField, type Choice } from "./fields";
import { ReferencePicker, type ReferenceItem } from "./reference-picker";

type StepProps = {
  draft: OrderDraft;
  update: (patch: Partial<OrderDraft>) => void;
  errors: FieldErrors;
  ctx: ValidationContext;
};

/** Elemento que recebe o foco quando o cliente toca numa pendência do resumo. */
export const FIELD_ANCHORS: Record<keyof OrderDraft, string> = {
  modalityId: "modalidade-0",
  categoryId: "tipo-0",
  techniqueOptionId: "tecnica-0",
  customTechnique: "tecnica-outra",
  sizeOptionId: "tamanho-0",
  customSize: "tamanho-outro",
  finishOptionId: "acabamento-0",
  fileFormatOptionId: "formato-0",
  deliveryOptionId: "entrega-0",
  description: "descricao",
  desiredDate: "data-desejada",
  name: "nome",
  email: "email",
  whatsapp: "whatsapp",
  city: "cidade",
  state: "estado",
  notes: "observacoes",
  privacyAccepted: "aceite-privacidade",
  portfolioConsent: "aceite-portfolio",
  artworkRefId: "inspiracao",
};

const deliveryTag = { fisica: "Entrega física", digital: "Arquivo digital" } as const;

const optionLabel = (ctx: ValidationContext, id: string) => ctx.data.options.find((o) => o.id === id)?.label ?? "";
const isCustomOption = (ctx: ValidationContext, id: string) =>
  ctx.data.options.find((o) => o.id === id)?.allowsCustom ?? false;

// ---------------------------------------------------------------------------
// Etapa 1: modalidade e tipo de arte
// ---------------------------------------------------------------------------

export function StepChoice({ draft, update, errors, ctx }: StepProps) {
  const inspiration = ctx.data.artworks.find((a) => a.id === draft.artworkRefId);
  const modality = findModality(ctx, draft.modalityId);
  const categoryChoices: Choice[] = modality
    ? [
        ...categoriesFor(ctx, modality.id).map((c) => ({
          value: c.id,
          label: c.name,
          image: c.image,
          imageFallback: "marca" as const,
          price: c.priceCents === null ? null : `A partir de ${formatPrice(c.priceCents)}`,
        })),
        { value: CUSTOM_CATEGORY, label: "Personalizado", description: "Outra ideia? Conte na etapa 3." },
      ]
    : [];

  return (
    <div className="flex flex-col gap-10">
      {inspiration && (
        <div id="inspiracao" className="flex items-center gap-4 rounded-card bg-peach-soft p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-blush">
            <Image
              src={inspiration.cover.path}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              style={{ objectPosition: focalPosition(inspiration.cover) }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-xs uppercase tracking-eyebrow text-rose">Inspirada em</p>
            <p className="font-serif text-xl leading-tight">{inspiration.title}</p>
            <button
              type="button"
              onClick={() => update({ artworkRefId: null })}
              className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4 hover:text-rose"
            >
              Remover inspiração
            </button>
          </div>
        </div>
      )}

      <ChoiceGroup
        name="modalidade"
        legend="Como você quer a sua obra?"
        variant="cards"
        value={draft.modalityId}
        onChange={(modalityId) => update({ modalityId })}
        error={errors.modalityId}
        choices={ctx.data.modalities.map((m) => {
          const from = startingPrice(ctx.data.options, m.id);
          return {
            value: m.id,
            label: m.name,
            description: m.description,
            image: m.image,
            tag: deliveryTag[m.deliveryKind],
            price: from === null ? null : `A partir de ${formatPrice(from)}`,
          };
        })}
      />

      {modality ? (
        <ChoiceGroup
          name="tipo"
          legend="Qual é o tema?"
          hint="Escolha o que mais se parece com a sua ideia."
          variant="tiles"
          value={draft.categoryId}
          onChange={(categoryId) => update({ categoryId })}
          error={errors.categoryId}
          choices={categoryChoices}
        />
      ) : (
        errors.categoryId === undefined && (
          <p className="text-sm text-plum-muted">Depois de escolher a modalidade, você escolhe o tema da obra.</p>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 2: técnica, tamanho e entrega
// ---------------------------------------------------------------------------

const GROUPS: Record<
  OptionKind,
  {
    name: string;
    legend: string;
    hint?: string;
    variant?: "cards" | "pills";
    custom?: { id: string; label: string; placeholder: string };
  }
> = {
  size: {
    name: "tamanho",
    legend: "Tamanho",
    custom: { id: "tamanho-outro", label: "Qual tamanho?", placeholder: "Ex.: 25 × 35 cm" },
  },
  technique: {
    name: "tecnica",
    legend: "Técnica",
    custom: { id: "tecnica-outra", label: "Qual técnica ou estilo?", placeholder: "Ex.: carvão, colagem…" },
  },
  finish: { name: "acabamento", legend: "Moldura" },
  file_format: {
    name: "formato",
    legend: "Formato do arquivo",
    hint: "A obra é entregue em arquivo digital de alta resolução.",
  },
  delivery: { name: "entrega", legend: "Como você quer receber?", variant: "cards" },
};

function OptionGroup({ ctx, draft, update, errors, kind }: StepProps & { kind: OptionKind }) {
  const options = availableOptions(ctx, draft, kind);
  if (options.length === 0) return null;
  const group = GROUPS[kind];
  const field = OPTION_FIELDS[kind];
  const customField = CUSTOM_FIELDS[kind];
  const showCustom = group.custom && customField && isCustomOption(ctx, draft[field]);
  return (
    <div className="flex flex-col gap-4">
      <ChoiceGroup
        name={group.name}
        legend={group.legend}
        hint={group.hint}
        variant={group.variant}
        value={draft[field]}
        onChange={(value) => update({ [field]: value })}
        error={errors[field]}
        choices={options.map((o) => ({
          value: o.id,
          label: o.label,
          description: group.variant === "cards" ? o.description : undefined,
          price: optionPriceLabel(o),
        }))}
      />
      {showCustom && (
        <TextField
          id={group.custom!.id}
          label={group.custom!.label}
          placeholder={group.custom!.placeholder}
          maxLength={LIMITS.customText}
          value={draft[customField]}
          onChange={(e) => update({ [customField]: e.target.value })}
          error={errors[customField]}
        />
      )}
    </div>
  );
}

export function StepDetails(props: StepProps) {
  return (
    <div className="flex flex-col gap-10">
      <p className="text-sm leading-relaxed text-plum-muted">
        Os preços são de referência. O valor final é confirmado pela artista no orçamento, conforme os detalhes do
        seu pedido.
      </p>
      {(Object.keys(OPTION_FIELDS) as OptionKind[]).map((kind) => (
        <OptionGroup key={kind} {...props} kind={kind} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 3: fotos, descrição e data desejada
// ---------------------------------------------------------------------------

export function StepInspiration({
  draft,
  update,
  errors,
  ctx,
  references,
}: StepProps & {
  references: {
    items: ReferenceItem[];
    messages: string[];
    forgottenNames: string[];
    onAdd: (files: File[]) => void;
    onRemove: (id: string) => void;
    inputRef: RefObject<HTMLInputElement | null>;
  };
}) {
  return (
    <div className="flex flex-col gap-10">
      <ReferencePicker
        {...references}
        maxFiles={ctx.data.settings.maxFiles}
        maxFileSizeMb={ctx.data.settings.maxFileSizeMb}
      />
      <TextArea
        id="descricao"
        label="Conte um pouco sobre a obra que você deseja."
        hint="Cores, elementos importantes, estilo, para quem é, a história por trás do momento…"
        rows={6}
        maxLength={LIMITS.description}
        counter
        value={draft.description}
        onChange={(e) => update({ description: e.target.value })}
        error={errors.description}
      />
      <TextField
        id="data-desejada"
        label="Quando você gostaria de receber?"
        hint="A data escolhida representa sua preferência e será confirmada pela artista após análise da encomenda."
        type="date"
        min={minDesiredDate(ctx)}
        max={maxDesiredDate(ctx)}
        value={draft.desiredDate}
        onChange={(e) => update({ desiredDate: e.target.value })}
        error={errors.desiredDate}
        className="sm:max-w-xs"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 4: dados do cliente
// ---------------------------------------------------------------------------

export function StepCustomer({ draft, update, errors, ctx }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <TextField
        id="nome"
        label="Nome completo"
        autoComplete="name"
        maxLength={LIMITS.name}
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        error={errors.name}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          id="email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LIMITS.email}
          value={draft.email}
          onChange={(e) => update({ email: e.target.value })}
          error={errors.email}
        />
        <TextField
          id="whatsapp"
          label="WhatsApp"
          hint="Com DDD. A artista vai conversar com você por aqui."
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(11) 91234-5678"
          value={formatBrPhone(draft.whatsapp)}
          onChange={(e) => update({ whatsapp: phoneInputDigits(e.target.value) })}
          error={errors.whatsapp}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <TextField
          id="cidade"
          label="Cidade"
          autoComplete="address-level2"
          maxLength={LIMITS.city}
          value={draft.city}
          onChange={(e) => update({ city: e.target.value })}
          error={errors.city}
        />
        <SelectField
          id="estado"
          label="Estado"
          placeholder="Escolha"
          autoComplete="address-level1"
          value={draft.state}
          onChange={(e) => update({ state: e.target.value })}
          error={errors.state}
        >
          {BR_STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextArea
        id="observacoes"
        label="Observações"
        optional
        rows={3}
        maxLength={LIMITS.notes}
        value={draft.notes}
        onChange={(e) => update({ notes: e.target.value })}
        error={errors.notes}
      />
      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <CheckboxField
          id="aceite-privacidade"
          checked={draft.privacyAccepted}
          onChange={(privacyAccepted) => update({ privacyAccepted })}
          error={errors.privacyAccepted}
        >
          Li e aceito a{" "}
          <Link href="/privacidade" target="_blank" className="underline underline-offset-4 hover:text-rose">
            política de privacidade<span className="sr-only"> (abre em nova aba)</span>
          </Link>
          . Meus dados e fotos são usados só para esta encomenda.
        </CheckboxField>
        {ctx.data.settings.askPortfolioConsent && (
          <CheckboxField
            id="aceite-portfolio"
            checked={draft.portfolioConsent}
            onChange={(portfolioConsent) => update({ portfolioConsent })}
          >
            Autorizo a artista a mostrar a obra pronta no portfólio (opcional).
          </CheckboxField>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 5: revisão
// ---------------------------------------------------------------------------

function ReviewBlock({
  title,
  step,
  onEdit,
  rows,
  children,
}: {
  title: string;
  step: StepNumber;
  onEdit: (step: StepNumber) => void;
  rows: [label: string, value: ReactNode][];
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl leading-tight">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex min-h-11 items-center text-[13px] uppercase tracking-nav underline underline-offset-4 hover:text-rose"
        >
          Editar<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[minmax(0,10rem)_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-plum-muted">{label}</dt>
            <dd className="mb-2 break-words whitespace-pre-line sm:mb-0">{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}

export function StepReview({
  draft,
  ctx,
  references,
  onEdit,
}: Omit<StepProps, "update" | "errors"> & { references: ReferenceItem[]; onEdit: (step: StepNumber) => void }) {
  const modality = findModality(ctx, draft.modalityId);
  const category =
    draft.categoryId === CUSTOM_CATEGORY
      ? "Personalizado"
      : (ctx.data.categories.find((c) => c.id === draft.categoryId)?.name ?? "");
  const inspiration = ctx.data.artworks.find((a) => a.id === draft.artworkRefId);
  const withCustom = (id: string, customText: string) =>
    isCustomOption(ctx, id) ? `${optionLabel(ctx, id)}: ${customText.trim()}` : optionLabel(ctx, id);
  const delivery =
    modality?.deliveryKind === "digital"
      ? `Arquivo digital em alta resolução${draft.fileFormatOptionId ? ` · ${optionLabel(ctx, draft.fileFormatOptionId)}` : ""}`
      : optionLabel(ctx, draft.deliveryOptionId) || "A combinar";
  const withPrice = (id: string, text: string) => {
    const option = ctx.data.options.find((o) => o.id === id);
    const price = option && optionPriceLabel(option);
    return price ? `${text} (${price})` : text;
  };
  const state = BR_STATES.find(([code]) => code === draft.state)?.[0] ?? draft.state;

  const optional = (value: string) => value || "Não se aplica";
  return (
    <div className="flex flex-col gap-5">
      <ReviewBlock
        title="Sua obra"
        step={1}
        onEdit={onEdit}
        rows={[
          ["Modalidade", modality?.name ?? ""],
          ["Tipo de arte", category],
          ...(inspiration ? [["Inspirada em", inspiration.title] as [string, string]] : []),
        ]}
      />
      <ReviewBlock
        title="Técnica, tamanho e entrega"
        step={2}
        onEdit={onEdit}
        rows={[
          ["Tamanho", optional(withPrice(draft.sizeOptionId, withCustom(draft.sizeOptionId, draft.customSize)))],
          ["Técnica", optional(withCustom(draft.techniqueOptionId, draft.customTechnique))],
          ...(draft.finishOptionId
            ? [["Moldura", withPrice(draft.finishOptionId, optionLabel(ctx, draft.finishOptionId))] as [string, string]]
            : []),
          ["Entrega", draft.deliveryOptionId ? withPrice(draft.deliveryOptionId, delivery) : delivery],
        ]}
      />
      <ReviewBlock
        title="Sua inspiração"
        step={3}
        onEdit={onEdit}
        rows={[
          ["Data desejada", draft.desiredDate ? formatLongDate(draft.desiredDate) : ""],
          ["Descrição", draft.description.trim()],
          ["Fotos", references.length === 0 ? "Nenhuma foto" : `${references.length} foto${references.length > 1 ? "s" : ""}`],
        ]}
      >
        {references.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Fotos de referência">
            {references.map((item, index) => (
              <li key={item.id} className="size-16 overflow-hidden rounded-lg bg-blush">
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
                <img src={item.previewUrl} alt={`Referência ${index + 1}`} className="size-full object-cover" />
              </li>
            ))}
          </ul>
        )}
      </ReviewBlock>
      <ReviewBlock
        title="Seus dados"
        step={4}
        onEdit={onEdit}
        rows={[
          ["Nome", draft.name.trim()],
          ["E-mail", draft.email.trim()],
          ["WhatsApp", formatBrPhone(draft.whatsapp)],
          ["Cidade", `${draft.city.trim()} / ${state}`],
          ...(draft.notes.trim() ? [["Observações", draft.notes.trim()] as [string, string]] : []),
          ...(ctx.data.settings.askPortfolioConsent
            ? [["Portfólio", draft.portfolioConsent ? "Autorizado" : "Não autorizado"] as [string, string]]
            : []),
        ]}
      />
    </div>
  );
}
