import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/admin-ui";
import { ListSkeleton } from "@/components/admin/order-list";
import { ContactForm, NotificationsForm, OrderFormSettingsForm } from "@/components/admin/settings-forms";
import { getAdminSettings } from "@/features/admin/catalog";
import { SETTINGS_SCHEMAS } from "@/features/admin/settings-forms";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Contatos, e-mail dos pedidos e regras do formulário de encomenda." />
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

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <ContactForm whatsappNumber={site.whatsappNumber} contactEmail={site.contactEmail} instagramHandle={site.instagramHandle} />
      <NotificationsForm orderEmail={notifications.data?.orderEmail ?? site.contactEmail ?? ""} />
      <OrderFormSettingsForm {...orderForm} />
    </div>
  );
}
