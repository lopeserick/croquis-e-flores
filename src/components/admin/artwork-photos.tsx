"use client";

import { useRef, useState } from "react";
import { dangerButton, Feedback, iconButton, outlineButton, Panel, Pill, smallButton } from "@/components/admin/admin-ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/fields";
import {
  addArtworkImage,
  deleteArtworkImage,
  moveArtworkImage,
  prepareArtworkImage,
  setArtworkCover,
  updateArtworkImage,
} from "@/features/admin/artwork-actions";
import type { AdminArtwork, AdminArtworkImage } from "@/features/admin/artworks";
import { GALLERY_ACCEPT } from "@/features/admin/gallery-images";
import { FocalPointField } from "./focal-point-field";
import { ImagePrepError, prepareImage, putToSignedUrl } from "./image-upload";
import { useFormAction } from "./use-form-action";

/** Fotos da obra: enviar, descrever, ponto de foco, capa, ordem e apagar. */
export function ArtworkPhotos({ artwork }: { artwork: AdminArtwork }) {
  return (
    <Panel
      title="Fotos"
      id="fotos"
      description="A capa aparece no card da galeria. As demais aparecem na página da obra, nesta ordem."
    >
      <PhotoUploader artwork={artwork} />
      {artwork.images.length === 0 ? (
        <p className="text-sm text-plum-muted">Nenhuma foto ainda. A obra só pode ser publicada com pelo menos uma.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {artwork.images.map((image, index) => (
            <PhotoCard
              key={image.id}
              image={image}
              index={index}
              total={artwork.images.length}
            />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function PhotoUploader({ artwork }: { artwork: AdminArtwork }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const upload = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    const problems: string[] = [];
    let sent = 0;
    for (const [index, file] of files.entries()) {
      setStatus({ ok: true, message: `Enviando foto ${index + 1} de ${files.length}…` });
      try {
        const image = await prepareImage(file);
        const prepared = await prepareArtworkImage({ artworkId: artwork.id, mime: image.mime, size: image.blob.size });
        if (!prepared.ok) throw new ImagePrepError(prepared.message);
        if (!(await putToSignedUrl(prepared.url, image))) {
          throw new ImagePrepError(`Não foi possível enviar "${file.name}". Confira a conexão e tente de novo.`);
        }
        const number = artwork.images.length + sent + 1;
        const saved = await addArtworkImage({
          artworkId: artwork.id,
          path: prepared.path,
          width: image.width,
          height: image.height,
          mime: image.mime,
          alt: `${artwork.title}, foto ${number}`.slice(0, 200),
        });
        if (!saved?.ok) throw new ImagePrepError(saved?.message ?? "Não foi possível salvar a foto.");
        sent++;
      } catch (error) {
        problems.push(error instanceof ImagePrepError ? error.message : `Falha ao enviar "${file.name}".`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    const done = sent === 1 ? "1 foto adicionada." : sent > 1 ? `${sent} fotos adicionadas.` : "";
    setStatus({
      ok: problems.length === 0,
      message: [done, ...problems, sent > 0 ? "Confira a descrição de cada foto." : ""].filter(Boolean).join(" "),
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border-strong bg-cream p-4">
      <input
        ref={inputRef}
        id="obra-fotos"
        type="file"
        accept={GALLERY_ACCEPT}
        multiple
        disabled={busy}
        aria-describedby="obra-fotos-dica"
        className="peer sr-only"
        onChange={(e) => void upload([...(e.target.files ?? [])])}
      />
      {/* O campo de arquivo fica escondido; o rótulo faz o papel do botão (e mostra o foco dele). */}
      <label
        htmlFor="obra-fotos"
        className={`${smallButton} cursor-pointer self-start peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        {busy ? "Enviando…" : "Adicionar fotos"}
      </label>
      <p id="obra-fotos-dica" className="text-sm text-plum-muted">
        JPG, PNG ou WebP. A foto é reduzida para 2400 px e convertida antes de enviar (os dados de localização da câmera
        são descartados).
      </p>
      <Feedback state={status} />
    </div>
  );
}

function PhotoCard({ image, index, total }: { image: AdminArtworkImage; index: number; total: number }) {
  const details = useFormAction(updateArtworkImage);
  const cover = useFormAction(setArtworkCover);
  const remove = useFormAction(deleteArtworkImage);
  const label = `Foto ${index + 1}`;
  const prefix = `foto-${image.id.slice(0, 8)}`;

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border p-4" aria-label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{label}</h3>
        {image.isCover && <Pill tone="strong">Capa</Pill>}
        <span className="text-xs text-plum-muted">
          {image.width} × {image.height} px
        </span>
      </div>

      <form onSubmit={details.onSubmit} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="imageId" value={image.id} />
        <TextField
          id={`${prefix}-alt`}
          name="alt"
          label="Descrição da foto (texto alternativo)"
          hint="Para quem usa leitor de tela. Ex.: Retrato a nanquim de uma mulher de chapéu."
          defaultValue={image.alt}
          error={details.error("alt")}
          maxLength={200}
        />
        <FocalPointField
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          defaultX={image.focalX}
          defaultY={image.focalY}
          idPrefix={prefix}
        />
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={details.pending} className={`${smallButton} self-start`}>
            {details.pending ? "Salvando…" : `Salvar ${label.toLowerCase()}`}
          </button>
          <Feedback state={details.state} />
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {!image.isCover && (
          <form onSubmit={cover.onSubmit}>
            <input type="hidden" name="imageId" value={image.id} />
            <button type="submit" disabled={cover.pending} className={outlineButton}>
              Usar como capa<span className="sr-only">: {label}</span>
            </button>
          </form>
        )}
        <form action={moveArtworkImage} className="flex gap-2">
          <input type="hidden" name="imageId" value={image.id} />
          <button type="submit" name="direction" value="up" disabled={index === 0} className={iconButton}>
            <ArrowLeftIcon size={16} className="rotate-90" />
            <span className="sr-only">Mover {label.toLowerCase()} para antes</span>
          </button>
          <button type="submit" name="direction" value="down" disabled={index === total - 1} className={iconButton}>
            <ArrowRightIcon size={16} className="rotate-90" />
            <span className="sr-only">Mover {label.toLowerCase()} para depois</span>
          </button>
        </form>
        <form
         
          onSubmit={(event) => {
            if (!window.confirm(`Apagar a ${label.toLowerCase()}? Não dá para desfazer.`)) {
              event.preventDefault();
              return;
            }
            remove.onSubmit(event);
          }}
          className="ml-auto"
        >
          <input type="hidden" name="imageId" value={image.id} />
          <button type="submit" disabled={remove.pending} className={dangerButton}>
            Apagar<span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        </form>
      </div>
      <Feedback state={cover.state ?? remove.state} />
    </li>
  );
}
