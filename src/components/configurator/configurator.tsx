"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button-link";
import { todayInSaoPaulo } from "@/features/orders/dates";
import type { OrderFormData } from "@/features/orders/form-types";
import { checkReference } from "@/features/orders/references";
import {
  autoSelectSingleOptions,
  emptyDraft,
  firstIncompleteStep,
  isEmpty,
  LAST_STEP,
  parseDraft,
  sanitizeDraft,
  STEPS,
  validateStep,
  type OrderDraft,
  type StepNumber,
  type ValidationContext,
} from "@/features/orders/schema";
import { SIGNATURE_BYTES } from "@/lib/security/file-signature";
import { ErrorSummary } from "./fields";
import type { ReferenceItem } from "./reference-picker";
import { StepProgress } from "./step-progress";
import { FIELD_ANCHORS, StepChoice, StepCustomer, StepDetails, StepInspiration, StepReview } from "./steps";

// Configurador de encomenda em 5 telas (docs/arquitetura.md, seção 7).
//
// - A etapa fica no endereço (?etapa=3): o "voltar" do celular volta uma etapa.
// - O rascunho (sem as fotos) fica no sessionStorage: não se perde se a aba
//   recarregar ao abrir a câmera no celular. Some ao fechar a aba.
// - Links de entrada: ?obra=slug ("Criar uma obra inspirada nesta"),
//   ?modalidade=slug, ?categoria=slug.

const STORAGE_KEY = "croquis-e-flores:encomenda:v1";
const PREFILL_PARAMS = ["obra", "modalidade", "categoria"] as const;

const subscribeNothing = () => () => {};

/** O formulário depende do navegador (rascunho, data de hoje): no servidor, só o esqueleto. */
export function Configurator({ data }: { data: OrderFormData }) {
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  return isClient ? <ConfiguratorForm data={data} /> : <ConfiguratorSkeleton />;
}

export function ConfiguratorSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <p role="status" className="sr-only">
        Carregando o formulário…
      </p>
      <div className="h-11 animate-pulse rounded-full bg-blush motion-reduce:animate-none" />
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-card bg-blush md:h-72" />
        ))}
      </div>
    </div>
  );
}

type Stored = { draft: OrderDraft; referenceNames: string[] };

function readStored(): Stored | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { draft?: unknown; referenceNames?: unknown };
    const names = Array.isArray(value.referenceNames)
      ? value.referenceNames.filter((n): n is string => typeof n === "string").slice(0, 20)
      : [];
    return { draft: parseDraft(value.draft), referenceNames: names };
  } catch {
    return null; // modo privado, armazenamento cheio ou conteúdo corrompido: começa do zero
  }
}

/** Aplica os links de entrada (?obra, ?modalidade, ?categoria) sobre o rascunho. */
function applyPrefill(draft: OrderDraft, params: URLSearchParams, ctx: ValidationContext): OrderDraft {
  const artwork = ctx.data.artworks.find((a) => a.slug === params.get("obra"));
  if (artwork) {
    return { ...draft, modalityId: artwork.modalityId, categoryId: artwork.categoryId, artworkRefId: artwork.id };
  }
  const next = { ...draft };
  const modality = ctx.data.modalities.find((m) => m.slug === params.get("modalidade"));
  if (modality) next.modalityId = modality.id;
  const category = ctx.data.categories.find((c) => c.slug === params.get("categoria"));
  if (category) next.categoryId = category.id;
  return next;
}

function setStepInUrl(step: StepNumber, mode: "push" | "replace") {
  const params = new URLSearchParams(window.location.search);
  for (const key of PREFILL_PARAMS) params.delete(key);
  if (step === 1) params.delete("etapa");
  else params.set("etapa", String(step));
  const query = params.toString();
  const url = query ? `?${query}` : window.location.pathname;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

function ConfiguratorForm({ data }: { data: OrderFormData }) {
  // useSearchParams, e não window.location: ao chegar por um link interno, o
  // endereço do navegador só muda depois que a página nova é desenhada.
  const searchParams = useSearchParams();
  const [initial] = useState(() => {
    const today = todayInSaoPaulo();
    const ctx: ValidationContext = { data, today };
    const stored = readStored();
    const prefilled = applyPrefill(stored?.draft ?? emptyDraft, new URLSearchParams(searchParams.toString()), ctx);
    return {
      today,
      draft: autoSelectSingleOptions(sanitizeDraft(prefilled, ctx), ctx),
      forgottenNames: stored?.referenceNames ?? [],
    };
  });
  const ctx = useMemo<ValidationContext>(() => ({ data, today: initial.today }), [data, initial.today]);

  const [draft, setDraft] = useState<OrderDraft>(initial.draft);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [referenceMessages, setReferenceMessages] = useState<string[]>([]);
  const [attempted, setAttempted] = useState<ReadonlySet<StepNumber>>(new Set());
  const [errorFocusTick, setErrorFocusTick] = useState(0);
  const [submitNotice, setSubmitNotice] = useState(false);

  // Etapa pedida no endereço. Acompanhada aqui (pushState + popstate) para o
  // "voltar" do navegador responder na hora, sem esperar o roteador do Next.
  const [requested, setRequested] = useState(() => Number(searchParams.get("etapa")) || 1);
  useEffect(() => {
    const onPopState = () => setRequested(Number(new URLSearchParams(window.location.search).get("etapa")) || 1);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const reachable = firstIncompleteStep(draft, ctx);
  const step = Math.max(1, Math.min(requested, reachable, LAST_STEP)) as StepNumber;
  const errors = attempted.has(step) ? validateStep(step, draft, ctx) : {};

  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const previousStep = useRef(step);

  // Endereço sem os parâmetros de entrada e com a etapa realmente aberta.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stale = PREFILL_PARAMS.some((key) => params.has(key)) || (Number(params.get("etapa")) || 1) !== step;
    if (stale) setStepInUrl(step, "replace");
  }, [step]);

  // Ao trocar de etapa: foco no título da nova etapa (leitor de tela anuncia) e topo do formulário.
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (errorFocusTick > 0) summaryRef.current?.focus();
  }, [errorFocusTick]);

  // Rascunho salvo a cada mudança (sem as fotos; só os nomes, para lembrar o cliente).
  useEffect(() => {
    try {
      const stored: Stored = { draft, referenceNames: references.map((r) => r.file.name) };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // sem armazenamento disponível: o formulário segue funcionando, só não guarda o rascunho
    }
  }, [draft, references]);

  // Libera a memória das prévias quando o formulário sai da tela.
  const referencesRef = useRef(references);
  useEffect(() => {
    referencesRef.current = references;
  }, [references]);
  useEffect(() => () => referencesRef.current.forEach((r) => URL.revokeObjectURL(r.previewUrl)), []);

  function update(patch: Partial<OrderDraft>) {
    setSubmitNotice(false);
    setDraft((current) => {
      const next = { ...current, ...patch };
      return "modalityId" in patch ? autoSelectSingleOptions(sanitizeDraft(next, ctx), ctx) : next;
    });
  }

  function goTo(target: StepNumber) {
    if (target === step) return;
    setStepInUrl(target, "push");
    setRequested(target);
  }

  function next() {
    if (!isEmpty(validateStep(step, draft, ctx))) {
      setAttempted((s) => new Set(s).add(step));
      setErrorFocusTick((t) => t + 1);
      return;
    }
    goTo((step + 1) as StepNumber);
  }

  /** Sempre a etapa anterior (o "voltar" do navegador segue o histórico, que pode ser outro). */
  function back() {
    goTo((step - 1) as StepNumber);
  }

  async function addReferences(files: File[]) {
    const { maxFiles } = data.settings;
    const messages: string[] = [];
    const accepted: ReferenceItem[] = [];
    let free = maxFiles - references.length;
    for (const file of files) {
      if (free <= 0) {
        messages.push(`Limite de ${maxFiles} fotos: "${file.name}" ficou de fora.`);
        continue;
      }
      const duplicate = [...references, ...accepted].some(
        (r) => r.file.name === file.name && r.file.size === file.size && r.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        messages.push(`"${file.name}" já está na lista.`);
        continue;
      }
      const head = new Uint8Array(await file.slice(0, SIGNATURE_BYTES).arrayBuffer());
      const check = checkReference(file, head, data.settings);
      if (!check.ok) {
        messages.push(check.reason);
        continue;
      }
      nextId.current += 1;
      accepted.push({ id: `ref-${nextId.current}`, file, previewUrl: URL.createObjectURL(file) });
      free -= 1;
    }
    if (accepted.length > 0) {
      messages.unshift(accepted.length === 1 ? "1 foto adicionada." : `${accepted.length} fotos adicionadas.`);
    }
    setReferences((current) => [...current, ...accepted]);
    setReferenceMessages(messages);
  }

  function removeReference(id: string) {
    const item = references.find((r) => r.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setReferences((current) => current.filter((r) => r.id !== id));
    setReferenceMessages([item ? `"${item.file.name}" removida.` : ""].filter(Boolean));
    fileInputRef.current?.focus();
  }

  function restart() {
    if (!window.confirm("Apagar tudo o que você preencheu e começar de novo?")) return;
    references.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setReferences([]);
    setReferenceMessages([]);
    setAttempted(new Set());
    setDraft(autoSelectSingleOptions(emptyDraft, ctx));
    setStepInUrl(1, "replace");
    setRequested(1);
  }

  const stepProps = { draft, update, errors, ctx };
  const errorList = Object.entries(errors) as [keyof OrderDraft, string][];
  const current = STEPS[step - 1];
  const hasProgress = JSON.stringify(draft) !== JSON.stringify(autoSelectSingleOptions(emptyDraft, ctx));

  return (
    <div className="flex flex-col gap-8">
      <StepProgress current={step} reachable={reachable} onSelect={goTo} />

      <form
        noValidate
        aria-labelledby="etapa-titulo"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < LAST_STEP) next();
          else setSubmitNotice(true);
        }}
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-eyebrow text-rose">
            Etapa {step} de {LAST_STEP}
          </p>
          <h2
            id="etapa-titulo"
            ref={headingRef}
            tabIndex={-1}
            className="scroll-mt-28 font-serif text-section font-normal focus:outline-none md:text-section-lg"
          >
            {current.title}
          </h2>
        </div>

        <ErrorSummary
          errors={errorList}
          anchors={FIELD_ANCHORS}
          summaryRef={summaryRef}
        />

        {step === 1 && <StepChoice {...stepProps} />}
        {step === 2 && <StepDetails {...stepProps} />}
        {step === 3 && (
          <StepInspiration
            {...stepProps}
            references={{
              items: references,
              messages: referenceMessages,
              forgottenNames: initial.forgottenNames,
              onAdd: addReferences,
              onRemove: removeReference,
              inputRef: fileInputRef,
            }}
          />
        )}
        {step === 4 && <StepCustomer {...stepProps} />}
        {step === 5 && <StepReview draft={draft} ctx={ctx} references={references} onEdit={goTo} />}

        {step === LAST_STEP && submitNotice && (
          <div role="status" className="rounded-card bg-peach-soft p-5 leading-relaxed">
            <p className="font-medium">Tudo certo com a sua solicitação.</p>
            <p className="text-plum-soft">
              O envio ainda está em construção: na próxima etapa do desenvolvimento, este botão registra o pedido,
              envia as fotos e avisa a artista por e-mail.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <button type="button" onClick={back} className={buttonClasses("secondary")}>
              Voltar
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={`${buttonClasses("primary")} sm:min-w-56`}>
            {step < LAST_STEP ? "Continuar" : "Solicitar orçamento"}
          </button>
        </div>
      </form>

      {hasProgress && (
        <p className="text-sm text-plum-muted">
          Seu rascunho fica guardado neste navegador até você fechar a aba.{" "}
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rose"
          >
            Recomeçar do zero
          </button>
        </p>
      )}
    </div>
  );
}
