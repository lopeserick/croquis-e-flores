import type { Metadata } from "next";
import Image from "next/image";
import { focalPosition } from "@/components/site/artwork-card";
import { PageIntro } from "@/components/site/page-intro";
import { ActionLink, ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import { galleryHref } from "@/features/catalog/gallery-filters";
import { formatPrice, optionPriceLabel, startingPrice } from "@/features/catalog/prices";
import {
  getActiveCategories,
  getActiveModalities,
  getActiveOptions,
  getPublishedArtworks,
} from "@/features/catalog/queries";
import type { OptionRow } from "@/features/catalog/types";
import { getSiteSettings } from "@/features/settings/site-settings";
import { pageMetadata } from "@/features/site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tipos de obra e preços",
  description: "Obra feita à mão, ilustração digital ou impressa: tamanhos, preços de referência, prazos e entrega.",
  path: "/tipos-de-obra",
});

const deliveryLabel = {
  fisica: "Entrega física",
  digital: "Entrega em arquivo digital",
} as const;

/** Linhas da tabela de preços de uma modalidade: tamanhos primeiro, depois acréscimos (moldura). */
const priceRows = (options: OptionRow[], modalityId: string) => {
  const priced = options.filter((o) => o.modalityId === modalityId && o.priceCents !== null);
  return [
    ...priced.filter((o) => o.kind === "size"),
    ...priced.filter((o) => o.kind === "finish" && (o.priceCents ?? 0) > 0),
  ];
};

/** "para Folha A4" quando a opção só vale com certos tamanhos. */
const requirementNote = (option: OptionRow, options: OptionRow[]) => {
  const labels = options.filter((o) => option.requiresOptionIds.includes(o.id)).map((o) => o.label);
  return labels.length > 0 ? `para ${labels.join(" ou ")}` : null;
};

/** Formas de entrega iguais em várias modalidades aparecem uma vez só. */
const uniqueDeliveryOptions = (options: OptionRow[]) =>
  options
    .filter((o) => o.kind === "delivery")
    .filter((o, index, list) => list.findIndex((other) => other.label === o.label) === index);

export default async function ArtTypesPage() {
  const [modalities, artworks, options, categories, settings] = await Promise.all([
    getActiveModalities(),
    getPublishedArtworks(),
    getActiveOptions(),
    getActiveCategories(),
    getSiteSettings(),
  ]);
  const pricedCategories = categories.filter((c) => c.priceCents !== null);
  const deliveryOptions = uniqueDeliveryOptions(options);
  const { commerce } = settings;

  return (
    <>
      <PageIntro eyebrow="Modalidades" title="Tipos de obra e preços">
        <p>Escolha como quer receber a sua: feita à mão, em arquivo digital ou impressa.</p>
      </PageIntro>
      <Container className="flex flex-col gap-16 py-14 md:gap-20 md:py-18">
        <ul className="grid gap-6 md:grid-cols-3">
          {modalities.map((modality) => {
            const hasArtworks = artworks.some((a) => a.modality.slug === modality.slug);
            const from = startingPrice(options, modality.id);
            const rows = priceRows(options, modality.id);
            return (
              <li
                key={modality.id}
                className="flex flex-col overflow-hidden rounded-card border border-border bg-white"
              >
                {modality.image && (
                  <div className="relative aspect-[4/3] bg-blush">
                    <Image
                      src={modality.image.path}
                      alt={modality.image.alt}
                      fill
                      sizes="(min-width: 768px) 30vw, 92vw"
                      className="object-cover"
                      style={{ objectPosition: focalPosition(modality.image) }}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-7">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-rose">
                    {deliveryLabel[modality.deliveryKind]}
                  </p>
                  <h2 className="font-serif text-[28px] leading-tight font-medium">{modality.name}</h2>
                  {from !== null && <p className="-mt-2 font-medium">A partir de {formatPrice(from)}</p>}
                  <p className="leading-relaxed text-plum-muted">{modality.description}</p>
                  {rows.length > 0 && (
                    <dl className="flex flex-col divide-y divide-border border-y border-border text-[15px]">
                      {rows.map((option) => (
                        <div key={option.id} className="flex justify-between gap-4 py-2">
                          <dt>
                            {option.label}
                            {requirementNote(option, options) && (
                              <span className="block text-xs text-plum-muted">{requirementNote(option, options)}</span>
                            )}
                          </dt>
                          <dd className="shrink-0 font-medium">{optionPriceLabel(option)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                    <ButtonLink href={`/encomendar?modalidade=${modality.slug}`} size="sm">
                      Encomendar<span className="sr-only"> {modality.name}</span>
                    </ButtonLink>
                    {hasArtworks && (
                      <ActionLink href={galleryHref(null, { modalidade: modality.slug })}>
                        Ver obras<span className="sr-only">: {modality.name}</span>
                      </ActionLink>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {pricedCategories.length > 0 && (
          <section aria-labelledby="colecoes-preco" className="flex flex-col gap-6">
            <h2 id="colecoes-preco" className="font-serif text-[32px] leading-tight">
              Coleções com preço próprio
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {pricedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-baseline justify-between gap-4 rounded-card border border-border bg-white p-6"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-2xl leading-tight">{category.name}</h3>
                    {category.tagline && <p className="text-sm text-plum-muted">{category.tagline}</p>}
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-xs text-plum-muted">a partir de</span>
                    <span className="font-medium">{formatPrice(category.priceCents as number)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="prazos" className="grid gap-10 rounded-card bg-peach-soft p-7 md:grid-cols-2 md:p-10">
          <div className="flex flex-col gap-4">
            <h2 id="prazos" className="font-serif text-[32px] leading-tight">
              Prazos e pagamento
            </h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-plum-soft">
              {[commerce.leadTime, commerce.paymentTerms, commerce.paymentMethods]
                .filter((text) => text.trim() !== "")
                .map((text) => (
                  <li key={text}>{text}</li>
                ))}
            </ul>
            {commerce.priceNote && <p className="text-sm leading-relaxed text-plum-muted">{commerce.priceNote}</p>}
          </div>
          {deliveryOptions.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-[32px] leading-tight">Entrega</h2>
              <ul className="flex flex-col gap-3">
                {deliveryOptions.map((option) => (
                  <li key={option.id} className="flex flex-col gap-0.5">
                    <p className="font-medium">
                      {option.label}
                      {optionPriceLabel(option) && (
                        <span className="font-normal text-plum-muted"> · {optionPriceLabel(option)}</span>
                      )}
                    </p>
                    {option.description && (
                      <p className="text-sm leading-relaxed text-plum-muted">{option.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
