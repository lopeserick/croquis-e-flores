"use client";

import { dangerButton, Feedback, outlineButton, Panel, Pill, smallButton } from "@/components/admin/admin-ui";
import { TextField } from "@/components/ui/fields";
import { deleteArtwork, setArtworkStatus } from "@/features/admin/artwork-actions";
import { ARTWORK_STATUS_LABELS } from "@/features/admin/artwork-rules";
import type { ArtworkStatus } from "@/features/catalog/types";
import { useFormAction } from "./use-form-action";

const explanation: Record<ArtworkStatus, string> = {
  publicada: "Aparece na galeria, na busca e (se for destaque) na página inicial.",
  rascunho: "Só você vê. Publique quando as fotos e os textos estiverem prontos.",
  arquivada: "Saiu do site, mas continua guardada aqui. Dá para publicar de novo quando quiser.",
};

/** Publicar, voltar para rascunho, arquivar e apagar de vez. */
export function ArtworkStatusPanel({
  id,
  slug,
  status,
  problems,
}: {
  id: string;
  slug: string;
  status: ArtworkStatus;
  /** O que falta para publicar (vazio = pode publicar). */
  problems: string[];
}) {
  const change = useFormAction(setArtworkStatus);

  return (
    <Panel title="Situação" id="situacao">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2">
          <Pill tone={status === "publicada" ? "strong" : "neutral"}>{ARTWORK_STATUS_LABELS[status]}</Pill>
        </p>
        <p className="text-sm text-plum-muted">{explanation[status]}</p>
        {status === "publicada" && (
          <a href={`/obra/${slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4">
            Ver no site<span className="sr-only"> (abre em nova aba)</span>
          </a>
        )}
      </div>

      {status !== "publicada" && problems.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-cream p-4 text-sm">
          <p className="font-medium">Para publicar, falta:</p>
          <ul className="list-disc pl-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={change.onSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-wrap gap-2">
          {status !== "publicada" && (
            <button type="submit" name="status" value="publicada" disabled={change.pending} className={smallButton}>
              Publicar
            </button>
          )}
          {status !== "rascunho" && (
            <button type="submit" name="status" value="rascunho" disabled={change.pending} className={outlineButton}>
              Voltar para rascunho
            </button>
          )}
          {status !== "arquivada" && (
            <button type="submit" name="status" value="arquivada" disabled={change.pending} className={outlineButton}>
              Arquivar
            </button>
          )}
        </div>
        <Feedback state={change.state} />
      </form>

      <DeleteArtwork id={id} />
    </Panel>
  );
}

function DeleteArtwork({ id }: { id: string }) {
  const remove = useFormAction(deleteArtwork);
  return (
    <details className="border-t border-border pt-4">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-rose underline underline-offset-4">
        Apagar a obra de vez
      </summary>
      <form onSubmit={remove.onSubmit} noValidate className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-plum-muted">
          Apaga a obra e as fotos dela. Não dá para desfazer. Para só tirar do site, prefira <strong>Arquivar</strong>.
        </p>
        <TextField id="apagar-confirmacao" name="confirm" label='Digite "apagar" para confirmar' autoComplete="off" autoCapitalize="none" />
        <button type="submit" disabled={remove.pending} className={`${dangerButton} self-start`}>
          {remove.pending ? "Apagando…" : "Apagar obra"}
        </button>
        <Feedback state={remove.state} />
      </form>
    </details>
  );
}
