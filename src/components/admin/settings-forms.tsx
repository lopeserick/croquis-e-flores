"use client";

import { useState, type ReactNode } from "react";
import { Checkbox, Feedback, outlineButton, Panel, smallButton } from "@/components/admin/admin-ui";
import { TextArea, TextField } from "@/components/ui/fields";
import type { AdminImage } from "@/features/admin/catalog";
import { saveSettingsSection } from "@/features/admin/content-actions";
import type { SettingsSectionId } from "@/features/admin/settings-forms";
import { formatBrPhone } from "@/features/orders/phone";
import { ImageAssetField } from "./image-asset-field";
import { useFormAction } from "./use-form-action";

// Formulários de Textos e Configurações. Cada um salva uma seção
// (src/features/admin/settings-forms.ts); o nome de cada campo é o caminho
// dentro da configuração (ex.: "hero.title"), e o erro volta com o mesmo nome.

type ErrorOf = (name: string) => string | undefined;

function SectionForm({
  section,
  title,
  description,
  submitLabel = "Salvar",
  children,
}: {
  section: SettingsSectionId;
  title: string;
  description?: ReactNode;
  submitLabel?: string;
  children: (error: ErrorOf) => ReactNode;
}) {
  const { state, pending, onSubmit, error } = useFormAction(saveSettingsSection);
  return (
    <Panel title={title} id={`secao-${section}`} description={description}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <input type="hidden" name="section" value={section} />
        {children(error)}
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={pending} className={`${smallButton} self-start`}>
            {pending ? "Salvando…" : submitLabel}
          </button>
          <Feedback state={state} />
        </div>
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

export function TopBarForm({ topBarMessage, footerDescription }: { topBarMessage: string; footerDescription: string }) {
  return (
    <SectionForm section="faixa" title="Faixa do topo e rodapé">
      {(error) => (
        <>
          <TextField
            id="faixa-topo"
            name="topBarMessage"
            label="Faixa rosa no topo do site"
            defaultValue={topBarMessage}
            error={error("topBarMessage")}
            maxLength={120}
          />
          <TextArea
            id="faixa-rodape"
            name="footerDescription"
            label="Frase do rodapé"
            optional
            rows={2}
            defaultValue={footerDescription}
            error={error("footerDescription")}
            maxLength={300}
          />
        </>
      )}
    </SectionForm>
  );
}

export type HeroValues = {
  eyebrow: string;
  title: string;
  titleEmphasis: string;
  description: string;
  highlights: string[];
  imageCaption: string;
  image: AdminImage | null;
};

export function HeroForm({ hero }: { hero: HeroValues }) {
  return (
    <SectionForm section="destaque" title="Destaque da página inicial" description="O primeiro bloco do site, com a foto grande.">
      {(error) => (
        <>
          <TextField id="destaque-sobre" name="hero.eyebrow" label="Linha acima do título" optional defaultValue={hero.eyebrow} error={error("hero.eyebrow")} maxLength={80} />
          <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
            <TextField id="destaque-titulo" name="hero.title" label="Título" defaultValue={hero.title} error={error("hero.title")} maxLength={80} />
            <TextField
              id="destaque-enfase"
              name="hero.titleEmphasis"
              label="Final do título, em destaque"
              optional
              hint="Ex.: arte."
              defaultValue={hero.titleEmphasis}
              error={error("hero.titleEmphasis")}
              maxLength={40}
            />
          </div>
          <TextArea id="destaque-texto" name="hero.description" label="Texto" optional rows={3} defaultValue={hero.description} error={error("hero.description")} maxLength={400} />
          <TextArea
            id="destaque-itens"
            name="hero.highlights"
            label="Itens com ✓ (um por linha)"
            optional
            hint="Até 4 linhas curtas."
            rows={4}
            defaultValue={hero.highlights.join("\n")}
            error={error("hero.highlights")}
          />
          <ImageAssetField name="hero.image" label="Foto do destaque" folder="site" owner="inicio" initial={hero.image} required error={error("hero.image")} />
          <TextField
            id="destaque-legenda"
            name="hero.imageCaption"
            label="Legenda da foto"
            optional
            defaultValue={hero.imageCaption}
            error={error("hero.imageCaption")}
            maxLength={120}
          />
        </>
      )}
    </SectionForm>
  );
}

export function EditorialExampleForm({ image }: { image: AdminImage | null }) {
  return (
    <SectionForm section="exemplo" title="Bloco “Sua ideia, nossa arte.”" description="A obra pronta mostrada ao lado da foto de referência.">
      {(error) => (
        <ImageAssetField name="editorialExample" label="Foto da obra pronta" folder="site" owner="inicio" initial={image} error={error("editorialExample")} />
      )}
    </SectionForm>
  );
}

type Step = { key: number; title: string; text: string };

export function StepsForm({ subtitle, steps }: { subtitle: string; steps: { title: string; text: string }[] }) {
  const [list, setList] = useState<Step[]>(() => steps.map((s, i) => ({ ...s, key: i })));
  const [nextKey, setNextKey] = useState(steps.length);
  const update = (key: number, patch: Partial<Step>) => setList((l) => l.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  return (
    <SectionForm section="passos" title="Como funciona" description="Os passos da encomenda, na ordem.">
      {(error) => (
        <>
          <TextField
            id="passos-subtitulo"
            name="howItWorks.subtitle"
            label="Frase abaixo do título"
            optional
            defaultValue={subtitle}
            error={error("howItWorks.subtitle")}
            maxLength={160}
          />
          <ol className="flex flex-col gap-4">
            {list.map((step, index) => (
              <li key={step.key} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">Passo {index + 1}</h3>
                  {list.length > 1 && (
                    <button type="button" className={outlineButton} onClick={() => setList((l) => l.filter((s) => s.key !== step.key))}>
                      Tirar<span className="sr-only"> o passo {index + 1}</span>
                    </button>
                  )}
                </div>
                <TextField
                  id={`passo-${step.key}-titulo`}
                  name={`howItWorks.steps.${index}.title`}
                  label="Título"
                  value={step.title}
                  onChange={(e) => update(step.key, { title: e.target.value })}
                  error={error(`howItWorks.steps.${index}.title`)}
                  maxLength={60}
                />
                <TextArea
                  id={`passo-${step.key}-texto`}
                  name={`howItWorks.steps.${index}.text`}
                  label="Texto"
                  rows={2}
                  value={step.text}
                  onChange={(e) => update(step.key, { text: e.target.value })}
                  error={error(`howItWorks.steps.${index}.text`)}
                  maxLength={300}
                />
              </li>
            ))}
          </ol>
          {list.length < 8 && (
            <button
              type="button"
              className={`${outlineButton} self-start`}
              onClick={() => {
                setList((l) => [...l, { key: nextKey, title: "", text: "" }]);
                setNextKey((k) => k + 1);
              }}
            >
              Adicionar passo
            </button>
          )}
          {error("howItWorks.steps") && <p className="text-sm text-rose">{error("howItWorks.steps")}</p>}
        </>
      )}
    </SectionForm>
  );
}

export type AboutValues = {
  heading: string;
  signature: string;
  intro: string;
  story: string;
  process: string;
  differentials: string;
  photo: AdminImage | null;
};

export function AboutForm({ about }: { about: AboutValues }) {
  const paragraph = (name: keyof AboutValues, label: string, error: ErrorOf) => (
    <TextArea
      id={`sobre-${name}`}
      name={name}
      label={label}
      optional
      hint="Parágrafo vazio não aparece no site."
      rows={4}
      defaultValue={about[name] as string}
      error={error(name)}
      maxLength={1500}
    />
  );
  return (
    <SectionForm section="sobre" title="Sobre a artista" description="Página inicial (resumo) e página “Sobre”.">
      {(error) => (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField id="sobre-titulo" name="heading" label="Título" defaultValue={about.heading} error={error("heading")} maxLength={80} />
            <TextField id="sobre-assinatura" name="signature" label="Assinatura" optional defaultValue={about.signature} error={error("signature")} maxLength={80} />
          </div>
          {paragraph("intro", "Apresentação", error)}
          {paragraph("story", "História", error)}
          {paragraph("process", "Como trabalha", error)}
          {paragraph("differentials", "Diferenciais", error)}
          <ImageAssetField name="photo" label="Foto" folder="site" owner="sobre" initial={about.photo} required error={error("photo")} />
        </>
      )}
    </SectionForm>
  );
}

export type CommerceValues = { leadTime: string; paymentMethods: string; paymentTerms: string; priceNote: string };

export function CommerceForm({ commerce }: { commerce: CommerceValues }) {
  const fields: [keyof CommerceValues, string][] = [
    ["leadTime", "Prazo"],
    ["paymentMethods", "Formas de pagamento"],
    ["paymentTerms", "Condições de pagamento"],
    ["priceNote", "Observação sobre os preços"],
  ];
  return (
    <SectionForm section="comercial" title="Prazos e pagamento" description="Aparecem em “Tipos de obra e preços”.">
      {(error) =>
        fields.map(([name, label]) => (
          <TextArea key={name} id={`comercial-${name}`} name={name} label={label} optional rows={2} defaultValue={commerce[name]} error={error(name)} maxLength={300} />
        ))
      }
    </SectionForm>
  );
}

export function LegalForm({ kind, text }: { kind: "privacidade" | "termos"; text: string }) {
  const privacy = kind === "privacidade";
  return (
    <SectionForm
      section={kind}
      title={privacy ? "Política de privacidade" : "Termos de uso"}
      description={
        privacy
          ? "Texto da Carla ou de um profissional (LGPD). Ao mudar, os próximos pedidos registram a nova versão aceita pelo cliente."
          : "Texto da Carla ou de um profissional."
      }
    >
      {(error) => (
        <TextArea
          id={`texto-${kind}`}
          name={privacy ? "privacy" : "terms"}
          label="Texto"
          optional
          hint="Separe os parágrafos com uma linha em branco. Vazio: a página mostra que o texto está pendente."
          rows={10}
          defaultValue={text}
          error={error(privacy ? "privacy" : "terms")}
          maxLength={20000}
        />
      )}
    </SectionForm>
  );
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

export function ContactForm({
  whatsappNumber,
  contactEmail,
  instagramHandle,
}: {
  whatsappNumber: string | null;
  contactEmail: string | null;
  instagramHandle: string;
}) {
  return (
    <SectionForm section="contato" title="Contato" description="Rodapé, página Contato e mensagens prontas do WhatsApp.">
      {(error) => (
        <>
          <TextField
            id="contato-whatsapp"
            name="whatsappNumber"
            label="WhatsApp"
            optional
            hint="Com DDD. Vazio: o site não mostra o botão de WhatsApp."
            type="tel"
            inputMode="tel"
            autoComplete="off"
            defaultValue={whatsappNumber ? formatBrPhone(whatsappNumber.slice(2)) : ""}
            error={error("whatsappNumber")}
          />
          <TextField
            id="contato-email"
            name="contactEmail"
            label="E-mail de contato"
            optional
            type="email"
            autoComplete="off"
            defaultValue={contactEmail ?? ""}
            error={error("contactEmail")}
          />
          <TextField
            id="contato-instagram"
            name="instagramHandle"
            label="Instagram"
            hint="Só o nome do perfil, sem @."
            autoComplete="off"
            autoCapitalize="none"
            defaultValue={instagramHandle}
            error={error("instagramHandle")}
          />
        </>
      )}
    </SectionForm>
  );
}

export function NotificationsForm({ orderEmail }: { orderEmail: string }) {
  return (
    <SectionForm
      section="avisos"
      title="E-mail que recebe os pedidos"
      description="Cada pedido novo gera um e-mail para este endereço. Não aparece no site."
    >
      {(error) => (
        <TextField
          id="avisos-email"
          name="orderEmail"
          label="E-mail"
          type="email"
          autoComplete="off"
          defaultValue={orderEmail}
          error={error("orderEmail")}
        />
      )}
    </SectionForm>
  );
}

export function OrderFormSettingsForm({
  minLeadDays,
  maxFiles,
  maxFileSizeMb,
  askPortfolioConsent,
}: {
  minLeadDays: number;
  maxFiles: number;
  maxFileSizeMb: number;
  askPortfolioConsent: boolean;
}) {
  return (
    <SectionForm section="formulario" title="Formulário de encomenda">
      {(error) => (
        <>
          <TextField
            id="formulario-prazo"
            name="minLeadDays"
            label="Prazo mínimo (dias)"
            hint="A data desejada só pode ser escolhida a partir de hoje + este número de dias."
            type="number"
            inputMode="numeric"
            min={0}
            max={365}
            defaultValue={minLeadDays}
            error={error("minLeadDays")}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              id="formulario-fotos"
              name="maxFiles"
              label="Máximo de fotos de referência"
              hint="De 0 a 20. Zero: o formulário não pede fotos."
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              defaultValue={maxFiles}
              error={error("maxFiles")}
            />
            <TextField
              id="formulario-tamanho"
              name="maxFileSizeMb"
              label="Tamanho máximo de cada foto (MB)"
              hint="De 1 a 10."
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              defaultValue={maxFileSizeMb}
              error={error("maxFileSizeMb")}
            />
          </div>
          <Checkbox
            name="askPortfolioConsent"
            label="Perguntar se posso mostrar a obra pronta no portfólio"
            defaultChecked={askPortfolioConsent}
          />
        </>
      )}
    </SectionForm>
  );
}
