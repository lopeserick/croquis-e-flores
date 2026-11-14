"use client";

import { useState } from "react";
import { Checkbox, Feedback, Panel, smallButton } from "@/components/admin/admin-ui";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import { saveArtwork } from "@/features/admin/artwork-actions";
import type { AdminArtwork, ArtworkFormOptions } from "@/features/admin/artworks";
import { useFormAction } from "./use-form-action";

/** Dados da obra (nova ou existente). As fotos ficam em ArtworkPhotos. */
export function ArtworkForm({ artwork, options }: { artwork: AdminArtwork | null; options: ArtworkFormOptions }) {
  const { state, pending, onSubmit, error } = useFormAction(saveArtwork);
  const [modalityId, setModalityId] = useState(artwork?.modalityId ?? "");
  const suggestions = [...new Set(options.techniques.filter((t) => t.modalityId === modalityId).map((t) => t.label))];
  const inactive = (item: { active: boolean }) => (item.active ? "" : " (inativa)");

  return (
    <Panel title={artwork ? "Dados da obra" : "Nova obra"} id="dados-obra">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {artwork && <input type="hidden" name="id" value={artwork.id} />}
        <TextField
          id="obra-titulo"
          name="title"
          label="Nome da obra"
          defaultValue={artwork?.title}
          error={error("title")}
          maxLength={120}
          required
        />
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            id="obra-colecao"
            name="categoryId"
            label="Coleção"
            placeholder="Escolha a coleção"
            defaultValue={artwork?.categoryId ?? ""}
            error={error("categoryId")}
          >
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {inactive(c)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="obra-modalidade"
            name="modalityId"
            label="Modalidade"
            placeholder="Escolha a modalidade"
            value={modalityId}
            onChange={(e) => setModalityId(e.target.value)}
            error={error("modalityId")}
          >
            {options.modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {inactive(m)}
              </option>
            ))}
          </SelectField>
          <TextField
            id="obra-tecnica"
            name="techniqueLabel"
            label="Técnica"
            hint="Aparece no card (ex.: Nanquim). Escolha uma sugestão ou escreva outra."
            list="tecnicas-sugeridas"
            defaultValue={artwork?.techniqueLabel}
            error={error("techniqueLabel")}
            maxLength={60}
            autoComplete="off"
          />
          <datalist id="tecnicas-sugeridas">
            {suggestions.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <TextField
            id="obra-dimensoes"
            name="dimensions"
            label="Dimensões"
            optional
            hint="Ex.: 20 × 25 cm"
            defaultValue={artwork?.dimensions}
            error={error("dimensions")}
            maxLength={60}
          />
        </div>
        <TextArea
          id="obra-descricao"
          name="shortDescription"
          label="Descrição curta"
          optional
          hint="Uma ou duas frases. Aparece no card da galeria."
          rows={2}
          defaultValue={artwork?.shortDescription}
          error={error("shortDescription")}
          maxLength={300}
        />
        <TextArea
          id="obra-historia"
          name="story"
          label="História da obra"
          optional
          hint="Aparece na página da obra. Separe parágrafos com uma linha em branco."
          rows={5}
          defaultValue={artwork?.story}
          error={error("story")}
          maxLength={4000}
        />
        <TextField
          id="obra-endereco"
          name="slug"
          label="Endereço da página"
          optional
          hint={
            artwork
              ? `Hoje: /obra/${artwork.slug}. Se mudar, links já compartilhados param de funcionar.`
              : "Deixe em branco: é criado a partir do nome."
          }
          defaultValue={artwork?.slug}
          error={error("slug")}
          maxLength={80}
          autoComplete="off"
          autoCapitalize="none"
        />
        <Checkbox
          name="featured"
          label="Destaque na página inicial"
          hint='Aparece na vitrine "Obras que contam histórias".'
          defaultChecked={artwork?.featured ?? false}
        />
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
            {pending ? "Salvando…" : artwork ? "Salvar dados" : "Criar obra"}
          </button>
          <Feedback state={state} />
        </div>
      </form>
    </Panel>
  );
}
