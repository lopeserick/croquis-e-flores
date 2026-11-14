import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, ListSkeleton } from "@/components/admin/admin-ui";
import {
  AboutForm,
  CommerceForm,
  EditorialExampleForm,
  HeroForm,
  LegalForm,
  StepsForm,
  TopBarForm,
} from "@/components/admin/settings-forms";
import { toAdminImage } from "@/features/admin/catalog";
import { getAdminSettings } from "@/features/admin/content";
import { SETTINGS_SCHEMAS } from "@/features/admin/settings-forms";

export const metadata: Metadata = { title: "Textos" };

export default function TextsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Textos do site"
        description="Cada bloco salva separado. Depois de salvar, o site já mostra a mudança."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Texts />
      </Suspense>
    </div>
  );
}

async function Texts() {
  const settings = await getAdminSettings();
  const read = <K extends keyof typeof SETTINGS_SCHEMAS>(key: K) => {
    const parsed = SETTINGS_SCHEMAS[key].safeParse(settings[key]);
    if (!parsed.success) throw new Error(`Configuração "${key}" ausente ou inválida no banco.`);
    return parsed.data as ReturnType<(typeof SETTINGS_SCHEMAS)[K]["parse"]>;
  };
  const site = read("site");
  const home = read("home");
  const about = read("about");
  const commerce = read("commerce");
  const legal = SETTINGS_SCHEMAS.legal.safeParse(settings.legal).data ?? { privacy: "", terms: "" };

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Blocos desta página" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {[
          ["secao-faixa", "Faixa e rodapé"],
          ["secao-destaque", "Destaque"],
          ["secao-exemplo", "Sua ideia, nossa arte"],
          ["secao-passos", "Como funciona"],
          ["secao-sobre", "Sobre"],
          ["secao-comercial", "Prazos e pagamento"],
          ["secao-privacidade", "Privacidade"],
          ["secao-termos", "Termos"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
            {label}
          </a>
        ))}
      </nav>
      <TopBarForm topBarMessage={site.topBarMessage} footerDescription={site.footerDescription} />
      <HeroForm hero={{ ...home.hero, image: toAdminImage(home.hero.image) }} />
      <EditorialExampleForm image={toAdminImage(home.editorialExample)} />
      <StepsForm subtitle={home.howItWorks.subtitle} steps={home.howItWorks.steps} />
      <AboutForm about={{ ...about, photo: toAdminImage(about.photo) }} />
      <CommerceForm commerce={commerce} />
      <LegalForm kind="privacidade" text={legal.privacy} />
      <LegalForm kind="termos" text={legal.terms} />
    </div>
  );
}
