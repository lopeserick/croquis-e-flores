import type { Metadata } from "next";
import { Suspense } from "react";
import { Configurator, ConfiguratorSkeleton } from "@/components/configurator/configurator";
import { PageIntro } from "@/components/site/page-intro";
import { Container } from "@/components/ui/layout";
import { getOrderFormData } from "@/features/orders/form-data";
import { pageMetadata } from "@/features/site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Encomende sua obra",
  description:
    "Escolha a modalidade, a técnica e o tamanho, envie suas fotos de referência e peça um orçamento à artista Carla.",
  path: "/encomendar",
});

export default function OrderPage() {
  return (
    <>
      <PageIntro eyebrow="Encomenda" title="Encomende sua obra">
        <p>
          Em 5 passos: escolha como quer a sua obra, conte sua ideia e envie suas fotos. A artista responde com um
          orçamento. Nada é cobrado pelo site.
        </p>
      </PageIntro>
      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
        <noscript>
          <p className="mb-6 rounded-card bg-peach-soft p-5">
            O formulário de encomenda precisa do JavaScript ativado no navegador. Se preferir, fale com a artista pelos
            contatos no fim da página.
          </p>
        </noscript>
        {/* O formulário lê a etapa do endereço (?etapa=): fica dentro de Suspense. */}
        <Suspense fallback={<ConfiguratorSkeleton />}>
          <ConfiguratorLoader />
        </Suspense>
        </div>
      </Container>
    </>
  );
}

async function ConfiguratorLoader() {
  const data = await getOrderFormData();
  return <Configurator data={data} />;
}
