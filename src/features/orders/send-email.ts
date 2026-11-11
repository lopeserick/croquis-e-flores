// Envio pela API HTTP do Resend (sem SDK: um POST basta).
// Nunca lança erro: o pedido já está gravado e o resultado vira email_status.

export type EmailMessage = {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailConfig = { apiKey: string; from: string; toOverride?: string };

export type EmailResult = { sent: true } | { sent: false; reason: string };

const TIMEOUT_MS = 10_000;

export async function sendEmail(
  message: EmailMessage,
  config: EmailConfig | null,
  fetchImpl: typeof fetch = fetch,
): Promise<EmailResult> {
  if (!config) return { sent: false, reason: "Envio de e-mail não configurado (RESEND_API_KEY)." };
  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [config.toOverride ?? message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return { sent: true };
    // A resposta do Resend traz só o motivo (sem dados do pedido).
    const detail = await response.text().catch(() => "");
    return { sent: false, reason: `Resend respondeu ${response.status}: ${detail.slice(0, 300)}` };
  } catch (error) {
    return { sent: false, reason: `Falha de rede ao enviar o e-mail: ${(error as Error).message}` };
  }
}
