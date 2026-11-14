import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Peças repetidas nas telas do painel.

export const smallButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-plum px-5 text-xs uppercase tracking-button text-cream hover:bg-orange-cta disabled:cursor-wait disabled:opacity-70";

export const outlineButton =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-white px-5 text-xs uppercase tracking-button text-plum hover:border-plum disabled:cursor-wait disabled:opacity-70";

export const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-rose bg-white px-5 text-xs uppercase tracking-button text-rose hover:bg-rose hover:text-cream disabled:cursor-wait disabled:opacity-70";

/** Botão quadrado de 44px (subir, descer). */
export const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border-strong bg-white text-plum hover:border-plum disabled:opacity-40";

/** Mensagem do resultado de um formulário, lida pelo leitor de tela ao aparecer. */
export function Feedback({ state }: { state: { ok: boolean; message: string } | null }) {
  return (
    <p role="status" className={state ? (state.ok ? "text-sm text-plum" : "text-sm text-rose") : "sr-only"}>
      {state?.message ?? ""}
    </p>
  );
}

export function Panel({
  title,
  id,
  description,
  children,
}: {
  title: string;
  id: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-serif text-2xl leading-tight">
          {title}
        </h2>
        {description && <div className="text-sm leading-relaxed text-plum-muted">{description}</div>}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-section leading-tight md:text-section-lg">{title}</h1>
        {description && <p className="max-w-2xl text-plum-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function BackLink({ href, children }: { href: ComponentProps<typeof Link>["href"]; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4">
      <span aria-hidden="true">←&nbsp;</span>
      {children}
    </Link>
  );
}

/** Etiqueta pequena (Publicada, Inativa…). */
export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "strong" | "warning" }) {
  const tones = {
    neutral: "border-border-strong bg-cream text-plum",
    strong: "border-plum bg-plum text-cream",
    warning: "border-rose bg-white text-rose",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Lista de abas de filtro (links), com a atual marcada. */
export function FilterTabs({ label, items }: { label: string; items: { href: string; label: string; current: boolean }[] }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 pb-1 md:flex-wrap">
        {items.map((f) => (
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
  );
}

/** Caixa de seleção para formulários com action (envia "on" quando marcada). */
export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  value,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  defaultChecked?: boolean;
  value?: string;
}) {
  const id = `${name}-${value ?? "check"}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          name={name}
          value={value}
          defaultChecked={defaultChecked}
          aria-describedby={hint ? `${id}-dica` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-orange-cta"
        />
        <span className="text-[15px] leading-relaxed">{label}</span>
      </label>
      {hint && (
        <p id={`${id}-dica`} className="pl-8 text-sm text-plum-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
