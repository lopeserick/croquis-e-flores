import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, ListSkeleton } from "@/components/admin/admin-ui";
import { ContactForm, NotificationsForm, OrderFormSettingsForm, RetentionForm } from "@/components/admin/settings-forms";
import { getAdminSettings } from "@/features/admin/content";
import { SETTINGS_SCHEMAS } from "@/features/admin/settings-forms";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Contatos, e-mail dos pedidos, regras do formulário de encomenda e por quanto tempo guardar as fotos dos clientes." />
      <Suspense fallback={<ListSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const settings = await getAdminSettings();
  const site = SETTINGS_SCHEMAS.site.parse(settings.site);
  const orderForm = SETTINGS_SCHEMAS.order_form.parse(settings.order_form);
  const notifications = SETTINGS_SCHEMAS.notifications.safeParse(settings.notifications);
  const retention = SETTINGS_SCHEMAS.retention.safeParse(settings.retention);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <ContactForm whatsappNumber={site.whatsappNumber} contactEmail={site.contactEmail} instagramHandle={site.instagramHandle} />
      <NotificationsForm orderEmail={notifications.data?.orderEmail ?? site.contactEmail ?? ""} />
      <OrderFormSettingsForm {...orderForm} />
      <RetentionForm referenceDays={retention.data?.referenceDays ?? null} />
    </div>
  );
}
