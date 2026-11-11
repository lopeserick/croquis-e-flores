import { LAST_STEP, STEPS, type StepNumber } from "@/features/orders/schema";

/**
 * Onde o cliente está. No celular: "Etapa 2 de 5" e uma barra. A partir do
 * tablet: as 5 etapas, e as já liberadas podem ser abertas com um toque.
 */
export function StepProgress({
  current,
  reachable,
  onSelect,
}: {
  current: StepNumber;
  /** Etapa mais adiantada que o cliente pode abrir (as anteriores estão completas). */
  reachable: StepNumber;
  onSelect: (step: StepNumber) => void;
}) {
  const step = STEPS[current - 1];
  return (
    <nav aria-label="Etapas da encomenda" className="flex flex-col gap-2.5">
      <p className="text-sm text-plum-muted md:hidden">
        Etapa {current} de {LAST_STEP} · <span className="font-medium text-plum">{step.short}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-blush md:hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-orange-cta" style={{ width: `${(current / LAST_STEP) * 100}%` }} />
      </div>
      <ol className="hidden gap-2 md:flex">
        {STEPS.map((s) => {
          const isCurrent = s.number === current;
          // Etapas antes da primeira pendente estão completas; a primeira pendente já pode ser aberta.
          const done = !isCurrent && s.number < reachable;
          const open = !isCurrent && s.number <= reachable;
          const content = (
            <>
              <span
                aria-hidden="true"
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                  isCurrent
                    ? "border-orange-cta bg-orange-cta text-white"
                    : done
                      ? "border-plum bg-plum text-cream"
                      : open
                        ? "border-plum text-plum"
                        : "border-border-strong text-plum-muted"
                }`}
              >
                {s.number}
              </span>
              <span className={isCurrent ? "font-medium text-plum" : open ? "text-plum" : "text-plum-muted"}>
                {s.short}
                <span className="sr-only">
                  {isCurrent ? " (etapa atual)" : done ? " (concluída)" : open ? " (liberada)" : " (ainda não liberada)"}
                </span>
              </span>
            </>
          );
          return (
            <li key={s.number} className="flex flex-1 items-center gap-2">
              {open ? (
                <button
                  type="button"
                  onClick={() => onSelect(s.number)}
                  className="flex min-h-11 items-center gap-2.5 rounded-full pr-3 text-left text-sm hover:underline"
                >
                  {content}
                </button>
              ) : (
                <span aria-current={isCurrent ? "step" : undefined} className="flex min-h-11 items-center gap-2.5 text-sm">
                  {content}
                </span>
              )}
              {s.number < LAST_STEP && <span aria-hidden="true" className="h-px flex-1 bg-border-strong" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
