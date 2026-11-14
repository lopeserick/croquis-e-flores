"use client";

import { useEffect, useRef, useState } from "react";
import { Feedback, outlineButton } from "@/components/admin/admin-ui";
import { FieldError, TextField } from "@/components/ui/fields";
import { prepareGalleryImage } from "@/features/admin/content-actions";
import { GALLERY_ACCEPT, type StoredImage } from "@/features/admin/gallery-images";
import type { GalleryFolder } from "@/features/catalog/image-url";
import { FocalPointField } from "./focal-point-field";
import { ImagePrepError, prepareImage, putToSignedUrl } from "./image-upload";

export type ImageFieldValue = StoredImage & { url: string };

/**
 * Uma foto dentro de um formulário (coleção, modalidade, destaque da página
 * inicial, foto do "Sobre"). A foto sobe na hora em que é escolhida; o
 * formulário envia num campo escondido o caminho, a descrição e o ponto de foco,
 * e o servidor confere tudo ao salvar.
 */
export function ImageAssetField({
  name,
  label,
  hint,
  folder,
  owner,
  initial,
  required = false,
  error,
}: {
  /** Nome do campo no formulário (ex.: "image", "hero.image"). */
  name: string;
  label: string;
  hint?: string;
  folder: GalleryFolder;
  owner: string;
  initial: ImageFieldValue | null;
  required?: boolean;
  error?: string;
}) {
  const [value, setValue] = useState<ImageFieldValue | null>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = `foto-${name.replace(/[^a-z0-9]+/gi, "-")}`;
  // Prévias locais (blob:) são liberadas ao trocar de foto ou sair da página.
  const previewUrl = value?.url;
  useEffect(() => () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setStatus({ ok: true, message: "Enviando a foto…" });
    try {
      const image = await prepareImage(file);
      const prepared = await prepareGalleryImage({ folder, owner, mime: image.mime, size: image.blob.size });
      if (!prepared.ok) throw new ImagePrepError(prepared.message);
      if (!(await putToSignedUrl(prepared.url, image))) {
        throw new ImagePrepError("Não foi possível enviar a foto. Confira a conexão e tente de novo.");
      }
      setValue({
        path: prepared.path,
        url: URL.createObjectURL(image.blob),
        width: image.width,
        height: image.height,
        alt: value?.alt ?? "",
        focalX: 50,
        focalY: 50,
      });
      setStatus({ ok: true, message: "Foto enviada. Confira a descrição e salve para aplicar." });
    } catch (e) {
      setStatus({ ok: false, message: e instanceof ImagePrepError ? e.message : "Não foi possível enviar a foto." });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // O que vai para o banco (sem o endereço de exibição).
  const stored = value && {
    path: value.path,
    alt: value.alt,
    width: value.width,
    height: value.height,
    focalX: value.focalX,
    focalY: value.focalY,
  };

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4" aria-describedby={hint ? `${id}-dica` : undefined}>
      <legend className="px-1 text-[15px] font-medium">
        {label}
        {!required && <span className="font-normal text-plum-muted"> (opcional)</span>}
      </legend>
      {hint && (
        <p id={`${id}-dica`} className="text-sm text-plum-muted">
          {hint}
        </p>
      )}
      <input type="hidden" name={name} value={stored ? JSON.stringify(stored) : ""} />

      {value ? (
        <>
          <TextField
            id={`${id}-alt`}
            label="Descrição da foto (texto alternativo)"
            value={value.alt}
            onChange={(e) => setValue({ ...value, alt: e.target.value })}
            maxLength={200}
            error={error}
          />
          <FocalPointField
            key={value.path}
            src={value.url}
            alt={value.alt}
            width={value.width}
            height={value.height}
            defaultX={value.focalX}
            defaultY={value.focalY}
            idPrefix={id}
            named={false}
            onChange={(focalX, focalY) => setValue((v) => (v ? { ...v, focalX, focalY } : v))}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-plum-muted">Nenhuma foto. {required ? "" : "Sem foto, o site mostra o símbolo da marca."}</p>
          <FieldError id={`${id}-alt`} error={error} />
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={`${id}-arquivo`}
          type="file"
          accept={GALLERY_ACCEPT}
          disabled={busy}
          className="peer sr-only"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <label
          htmlFor={`${id}-arquivo`}
          className={`${outlineButton} cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum ${busy ? "pointer-events-none opacity-70" : ""}`}
        >
          {busy ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
          <span className="sr-only">: {label}</span>
        </label>
        {value && !required && (
          <button type="button" className={outlineButton} onClick={() => setValue(null)}>
            Tirar foto<span className="sr-only">: {label}</span>
          </button>
        )}
      </div>
      <Feedback state={status} />
    </fieldset>
  );
}
