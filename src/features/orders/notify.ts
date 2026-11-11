import "server-only";
import { z } from "zod";
import { getSiteSettings } from "@/features/settings/site-settings";
import { getEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import { buildOrderEmail } from "./email-template";
import { getOrderFormSettings } from "./form-data";
import { sendEmail, type EmailConfig } from "./send-email";
import { parseStoredSummary } from "./summary";
import { artistToCustomerLink } from "./whatsapp";

// E-mail "Nova solicitação" para a artista, montado a partir do pedido
// gravado. Usado no envio do pedido e no "Reenviar e-mail" do painel.
// Nunca lança erro: o resultado vira email_status e um evento no histórico.

const notificationsSchema = z.object({ orderEmail: z.email() });

/** E-mail que recebe os pedidos: configuração privada; se faltar, o de contato do site. */
async function orderRecipient(): Promise<string | null> {
  const { data } = await createAdminClient().from("settings").select("value").eq("key", "notifications").maybeSingle();
  const parsed = notificationsSchema.safeParse(data?.value);
  if (parsed.success) return parsed.data.orderEmail;
  return (await getSiteSettings()).contactEmail;
}

function emailConfig(): EmailConfig | null {
  try {
    const env = getEnv("email");
    return { apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, toOverride: env.EMAIL_TO_OVERRIDE };
  } catch {
    return null; // ainda não configurado: o pedido fica gravado e marcado para reenvio
  }
}

/**
 * @param authorId quem pediu o reenvio pelo painel (vazio no envio automático)
 */
export async function notifyArtist(orderId: string, authorId: string | null = null): Promise<{ sent: boolean }> {
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select(
      "id, number, choices, desired_date, description, notes, customer_name, customer_email, customer_whatsapp, city, state, portfolio_consent, order_references(count)",
    )
    .eq("id", orderId)
    .single();
  if (error || !order) {
    console.error(`[pedido ${orderId}] não encontrado para o e-mail`, error?.message);
    return { sent: false };
  }

  const settings = await getOrderFormSettings();
  const referenceCount = order.order_references[0]?.count ?? 0;
  const message = buildOrderEmail({
    number: order.number,
    summary: parseStoredSummary(order.choices),
    desiredDate: order.desired_date,
    description: order.description,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      whatsapp: order.customer_whatsapp,
      city: order.city,
      state: order.state,
      notes: order.notes ?? "",
      portfolioConsent: settings.askPortfolioConsent ? order.portfolio_consent : null,
    },
    referenceCount,
    panelUrl: `${getEnv("site").NEXT_PUBLIC_SITE_URL}/admin/pedidos/${order.id}`,
    whatsappUrl: artistToCustomerLink(`55${order.customer_whatsapp}`, order.number, order.customer_name),
  });

  const config = emailConfig();
  const recipient = await orderRecipient();
  const result = recipient
    ? await sendEmail({ ...message, to: recipient, replyTo: order.customer_email }, config)
    : { sent: false as const, reason: "E-mail de recebimento dos pedidos não configurado." };
  // Em desenvolvimento o e-mail vai para o endereço de teste: o histórico diz para onde foi de fato.
  const to = config?.toOverride ?? recipient;

  await db
    .from("orders")
    .update({ email_status: result.sent ? "enviado" : "falhou" })
    .eq("id", order.id);
  await db.from("order_events").insert({
    order_id: order.id,
    type: result.sent ? "email_enviado" : "email_falhou",
    body: result.sent ? `E-mail enviado para ${to}.` : result.reason,
    author_id: authorId,
  });
  if (!result.sent) console.error(`[pedido ${order.number}] e-mail não enviado: ${result.reason}`);
  return { sent: result.sent };
}
