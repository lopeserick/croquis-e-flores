import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, ListSkeleton } from "@/components/admin/admin-ui";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { listAdminTestimonials } from "@/features/admin/content";

export const metadata: Metadata = { title: "Depoimento" };

export default function TestimonialPage(props: PageProps<"/admin/depoimentos/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/depoimentos">Todos os depoimentos</BackLink>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Testimonial params={props.params} />
      </Suspense>
    </div>
  );
}

async function Testimonial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testimonials = await listAdminTestimonials();
  const testimonial = id === "novo" ? null : testimonials.find((t) => t.id === id);
  if (testimonial === undefined) notFound();

  return (
    <>
      <h1 className="font-serif text-section leading-tight md:text-section-lg">
        {testimonial ? "Editar depoimento" : "Novo depoimento"}
      </h1>
      <div className="max-w-3xl">
        <TestimonialForm testimonial={testimonial} />
      </div>
    </>
  );
}
