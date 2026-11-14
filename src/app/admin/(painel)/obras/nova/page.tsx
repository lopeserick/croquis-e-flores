import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink, ListSkeleton } from "@/components/admin/admin-ui";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { getArtworkFormOptions } from "@/features/admin/artworks";

export const metadata: Metadata = { title: "Nova obra" };

export default function NewArtworkPage() {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/obras">Todas as obras</BackLink>
      <h1 className="font-serif text-section leading-tight md:text-section-lg">Nova obra</h1>
      <p className="max-w-2xl text-plum-muted">
        Preencha os dados e crie a obra. Em seguida, envie as fotos e publique. Até publicar, ela fica só no painel.
      </p>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const options = await getArtworkFormOptions();
  return <ArtworkForm artwork={null} options={options} />;
}
