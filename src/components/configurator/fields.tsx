import Image from "next/image";
import type { ComponentProps, ReactNode, RefObject } from "react";
import { focalPosition } from "@/components/site/artwork-card";
import type { ImageAsset } from "@/features/catalog/types";

// Campos do configurador. Texto em 16px (o iPhone não dá zoom ao focar),
// alvos de toque de no mínimo 44px, erro ligado ao campo por aria-describedby.

const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  [hint ? `${id}-dica` : null, error ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;

const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-white px-4 text-base text-plum placeholder:text-plum-muted focus:border-plum ${
    error ? "border-rose" : "border-border-strong"
  }`;

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-erro`} className="flex items-start gap-1.5 text-sm text-rose">
      <span aria-hidden="true">!</span>
      {error}
    </p>
  );
}

type FieldShellProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, optional, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}
        {optional && <span className="font-normal text-plum-muted"> (opcional)</span>}
      </label>
      {hint && (
        <div id={`${id}-dica`} className="text-sm leading-relaxed text-plum-muted">
          {hint}
        </div>
      )}
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

type TextFieldProps = Omit<FieldShellProps, "children"> &
  Omit<ComponentProps<"input">, "id" | "children"> & { inputRef?: RefObject<HTMLInputElement | null> };

export function TextField({ id, label, hint, error, optional, inputRef, className = "", ...input }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={id}
        ref={inputRef}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass(error)} min-h-12 ${className}`}
        {...input}
      />
    </FieldShell>
  );
}

type TextAreaProps = Omit<FieldShellProps, "children"> &
  Omit<ComponentProps<"textarea">, "id" | "children"> & { counter?: boolean };

export function TextArea({ id, label, hint, error, optional, counter, ...textarea }: TextAreaProps) {
  const length = String(textarea.value ?? "").length;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass(error)} min-h-32 py-3 leading-relaxed`}
        {...textarea}
      />
      {counter && textarea.maxLength && (
        <p className="text-right text-xs text-plum-muted" aria-hidden="true">
          {length}/{textarea.maxLength}
        </p>
      )}
    </FieldShell>
  );
}

type SelectFieldProps = Omit<FieldShellProps, "children"> &
  Omit<ComponentProps<"select">, "id"> & { placeholder: string };

export function SelectField({ id, label, hint, error, optional, placeholder, children, ...select }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${inputClass(error)} min-h-12 appearance-none pr-10`}
          {...select}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <svg
          aria-hidden="true"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </FieldShell>
  );
}

export function CheckboxField({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erro` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-orange-cta"
        />
        <span className="text-[15px] leading-relaxed">{children}</span>
      </label>
      <FieldError id={id} error={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escolha entre opções (rádio): cartões com foto ou pílulas
// ---------------------------------------------------------------------------

export type Choice = {
  value: string;
  label: string;
  description?: string;
  image?: ImageAsset | null;
  /** Etiqueta pequena acima do nome ("Entrega física"). */
  tag?: string;
};

type ChoiceGroupProps = {
  /** Nome do grupo e base dos ids (o primeiro rádio recebe o id `${name}-0`). */
  name: string;
  legend: string;
  hint?: ReactNode;
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  variant?: "cards" | "tiles" | "pills";
};

/** Rádios nativos estilizados: teclado (setas), leitor de tela e foco funcionam como o navegador manda. */
export function ChoiceGroup({ name, legend, hint, choices, value, onChange, error, variant = "pills" }: ChoiceGroupProps) {
  const layout = {
    cards: "grid gap-3 md:grid-cols-3",
    tiles: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5",
    pills: "flex flex-wrap gap-2.5",
  }[variant];

  return (
    <fieldset aria-describedby={describedBy(name, hint, error)} className="flex flex-col gap-3">
      <legend className="mb-1 font-serif text-2xl leading-tight md:text-[28px]">{legend}</legend>
      {hint && (
        <div id={`${name}-dica`} className="-mt-1 text-sm leading-relaxed text-plum-muted">
          {hint}
        </div>
      )}
      <div className={layout}>
        {choices.map((choice, index) => (
          <ChoiceOption
            key={choice.value}
            id={`${name}-${index}`}
            name={name}
            choice={choice}
            checked={value === choice.value}
            onSelect={() => onChange(choice.value)}
            variant={variant}
            invalid={Boolean(error)}
          />
        ))}
      </div>
      <FieldError id={name} error={error} />
    </fieldset>
  );
}

function ChoiceOption({
  id,
  name,
  choice,
  checked,
  onSelect,
  variant,
  invalid,
}: {
  id: string;
  name: string;
  choice: Choice;
  checked: boolean;
  onSelect: () => void;
  variant: NonNullable<ChoiceGroupProps["variant"]>;
  invalid: boolean;
}) {
  const details = [choice.tag ? `${id}-tag` : null, choice.description ? `${id}-desc` : null].filter(Boolean);
  // Rádio transparente cobrindo o cartão inteiro: toque em qualquer ponto
  // marca a opção, e o foco do teclado continua no rádio nativo.
  const radio = (
    <input
      id={id}
      type="radio"
      name={name}
      value={choice.value}
      checked={checked}
      onChange={onSelect}
      aria-labelledby={`${id}-nome`}
      aria-describedby={details.length > 0 ? details.join(" ") : undefined}
      className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-[inherit] opacity-0"
    />
  );
  const ring =
    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-plum";
  const border = checked ? "border-plum" : invalid ? "border-rose" : "border-border-strong hover:border-plum";

  if (variant === "pills") {
    return (
      <label
        htmlFor={id}
        className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4.5 text-[15px] transition-colors ${ring} ${border} ${
          checked ? "bg-plum text-cream" : "bg-white text-plum"
        }`}
      >
        {radio}
        {checked && <CheckMark />}
        <span id={`${id}-nome`}>{choice.label}</span>
      </label>
    );
  }

  const tile = variant === "tiles";
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer overflow-hidden rounded-card border-2 bg-white transition-colors ${ring} ${border} ${
        tile ? "flex-col" : "flex-row md:flex-col"
      } ${checked ? "bg-blush" : ""}`}
    >
      {radio}
      {choice.image ? (
        <span
          className={`relative block shrink-0 bg-blush ${
            tile ? "aspect-[4/3] w-full" : "w-28 self-stretch md:aspect-[4/3] md:w-full"
          }`}
        >
          <Image
            src={choice.image.path}
            alt=""
            fill
            sizes={tile ? "(min-width: 768px) 20vw, 45vw" : "(min-width: 768px) 30vw, 112px"}
            className="object-cover"
            style={{ objectPosition: focalPosition(choice.image) }}
          />
        </span>
      ) : (
        tile && (
          <span aria-hidden="true" className="flex aspect-[4/3] w-full items-center justify-center bg-peach-soft font-script text-3xl text-rose">
            sua ideia
          </span>
        )
      )}
      <span className={`flex flex-1 flex-col gap-1 ${tile ? "p-3.5" : "p-4 md:p-5"}`}>
        {choice.tag && (
          <span id={`${id}-tag`} className="text-[11px] uppercase tracking-[0.14em] text-rose">
            {choice.tag}
          </span>
        )}
        <span id={`${id}-nome`} className={`font-serif leading-tight font-medium ${tile ? "text-lg" : "text-[22px]"}`}>
          {choice.label}
        </span>
        {choice.description && (
          <span id={`${id}-desc`} className="text-sm leading-relaxed text-plum-muted">
            {choice.description}
          </span>
        )}
      </span>
      {checked && (
        <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-plum text-cream">
          <CheckMark />
        </span>
      )}
    </label>
  );
}

function CheckMark() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Lista de pendências no topo da etapa. Cada item leva o foco ao campo. */
export function ErrorSummary({
  errors,
  anchors,
  summaryRef,
}: {
  errors: [field: string, message: string][];
  /** id do elemento que recebe o foco para cada campo. */
  anchors: Record<string, string>;
  summaryRef: RefObject<HTMLDivElement | null>;
}) {
  if (errors.length === 0) return null;
  return (
    <div
      ref={summaryRef}
      id="pendencias"
      tabIndex={-1}
      role="alert"
      aria-labelledby="pendencias-titulo"
      className="flex flex-col gap-2 rounded-card border-2 border-rose bg-white p-5"
    >
      <p id="pendencias-titulo" className="font-medium">
        {errors.length === 1 ? "Falta 1 informação:" : `Faltam ${errors.length} informações:`}
      </p>
      <ul className="flex flex-col gap-1">
        {errors.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${anchors[field] ?? field}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(anchors[field] ?? field)?.focus();
              }}
              className="inline-flex min-h-11 items-center text-rose underline underline-offset-4"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
