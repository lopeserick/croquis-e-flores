import type { RefObject } from "react";
import { ACCEPT_ATTRIBUTE } from "@/features/orders/references";
import type { ImageMime } from "@/lib/security/file-signature";

/** Foto escolhida, já conferida pelo conteúdo (mime = tipo real). */
export type ReferenceItem = { id: string; file: File; mime: ImageMime; previewUrl: string };

/**
 * Fotos de referência: escolher (galeria ou câmera do celular), ver a prévia
 * e remover antes de enviar. As fotos só sobem ao enviar o pedido.
 */
export function ReferencePicker({
  items,
  messages,
  forgottenNames,
  maxFiles,
  maxFileSizeMb,
  onAdd,
  onRemove,
  inputRef,
}: {
  items: ReferenceItem[];
  /** Avisos da última seleção (arquivo recusado, limite atingido). */
  messages: string[];
  /** Fotos que estavam no rascunho e precisam ser escolhidas de novo. */
  forgottenNames: string[];
  maxFiles: number;
  maxFileSizeMb: number;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const full = items.length >= maxFiles;
  return (
    <section aria-labelledby="referencias-titulo" className="flex flex-col gap-3">
      <h3 id="referencias-titulo" className="font-serif text-2xl leading-tight md:text-[28px]">
        Fotos de referência <span className="font-sans text-base text-plum-muted">(opcional)</span>
      </h3>
      <p id="referencias-dica" className="text-sm leading-relaxed text-plum-muted">
        Fotos da pessoa, do momento ou do estilo que você imagina. JPG, PNG ou WebP, até {maxFiles} fotos de até{" "}
        {maxFileSizeMb} MB cada. Elas são vistas só pela artista.
      </p>

      {forgottenNames.length > 0 && items.length === 0 && (
        <p className="rounded-xl bg-peach-soft px-4 py-3 text-sm leading-relaxed text-plum-soft">
          Por segurança, as fotos não ficam guardadas no rascunho. Escolha de novo: {forgottenNames.join(", ")}.
        </p>
      )}

      <label
        htmlFor="referencias"
        className={`flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed px-4 py-5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-plum ${
          full ? "cursor-not-allowed border-border bg-white text-plum-muted" : "cursor-pointer border-border-strong bg-white hover:border-plum"
        }`}
      >
        <input
          ref={inputRef}
          id="referencias"
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          disabled={full}
          aria-describedby="referencias-dica referencias-contagem"
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = ""; // permite escolher a mesma foto de novo depois de remover
            if (files.length > 0) onAdd(files);
          }}
        />
        <span className="text-[15px] font-medium uppercase tracking-button text-orange-cta">
          {full ? "Limite de fotos atingido" : items.length > 0 ? "Adicionar mais fotos" : "Escolher fotos"}
        </span>
        <span id="referencias-contagem" className="text-sm text-plum-muted">
          {items.length} de {maxFiles} fotos
        </span>
      </label>

      <div role="status" aria-live="polite">
        {messages.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-xl bg-blush px-4 py-3 text-sm text-plum">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-5" aria-label="Fotos escolhidas">
          {items.map((item, index) => (
            <li key={item.id} className="flex min-w-0 flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-blush">
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), não passa pelo otimizador */}
                <img
                  src={item.previewUrl}
                  alt={`Referência ${index + 1}: ${item.file.name}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full bg-plum/85 text-cream hover:bg-plum"
                >
                  <span className="sr-only">Remover {item.file.name}</span>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <span className="truncate text-xs text-plum-muted" aria-hidden="true">
                {item.file.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
