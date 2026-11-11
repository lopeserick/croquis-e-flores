import { formatLongDate } from "./dates";
import { formatBrPhone } from "./phone";
import type { OrderSummary, SummaryRow } from "./summary";

// E-mail "Nova solicitação" para a artista. Todo texto vindo do cliente passa
// por escapeHtml: um nome como "<script>" aparece como texto, nunca como código.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type OrderEmailInput = {
  number: string;
  summary: OrderSummary;
  /** null em pedidos antigos sem data. */
  desiredDate: string | null;
  description: string;
  customer: {
    name: string;
    email: string;
    /** Número nacional, só dígitos. */
    whatsapp: string;
    city: string;
    state: string;
    notes: string;
    portfolioConsent: boolean | null;
  };
  referenceCount: number;
  /** Página do pedido no painel (exige login; as fotos abrem por lá). */
  panelUrl: string;
  /** Conversa da artista com o cliente. */
  whatsappUrl: string;
};

export function buildOrderEmail(input: OrderEmailInput): { subject: string; html: string; text: string } {
  const { customer } = input;
  const photos =
    input.referenceCount === 0
      ? "Nenhuma foto de referência"
      : `${input.referenceCount} foto${input.referenceCount > 1 ? "s" : ""} de referência (abrir no painel)`;
  const customerRows: SummaryRow[] = [
    ["Nome", customer.name],
    ["E-mail", customer.email],
    ["WhatsApp", formatBrPhone(customer.whatsapp)],
    ["Cidade", `${customer.city} / ${customer.state}`],
    ...(customer.notes ? [["Observações", customer.notes] as SummaryRow] : []),
    ...(customer.portfolioConsent === null
      ? []
      : [["Portfólio", customer.portfolioConsent ? "Autorizou mostrar a obra pronta" : "Não autorizou"] as SummaryRow]),
  ];
  const sections: [title: string, rows: SummaryRow[]][] = [
    ["A obra", [...input.summary.work, ...input.summary.details]],
    [
      "Inspiração",
      [
        ["Data desejada", input.desiredDate ? formatLongDate(input.desiredDate) : "Não informada"],
        ["Descrição", input.description],
        ["Fotos", photos],
      ],
    ],
    ["Cliente", customerRows],
  ];

  const subject = `Nova solicitação ${input.number} · ${customer.name}`;

  const rowHtml = ([label, value]: SummaryRow) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6b5560;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>` +
    `<td style="padding:6px 0;white-space:pre-line">${escapeHtml(value)}</td></tr>`;
  const button = (href: string, text: string, background: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;background:${background};color:#ffffff;text-decoration:none;font-weight:600">${escapeHtml(text)}</a>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#fff7f2;font-family:Arial,Helvetica,sans-serif;color:#2b1a22;font-size:15px;line-height:1.5">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
    <p style="margin:0;color:#b4224f;font-size:12px;letter-spacing:2px;text-transform:uppercase">Croquis e Flores</p>
    <h1 style="margin:6px 0 4px;font-size:24px;font-weight:normal">Nova solicitação ${escapeHtml(input.number)}</h1>
    <p style="margin:0 0 20px;color:#6b5560">${escapeHtml(customer.name)} pediu um orçamento pelo site.</p>
    <p style="margin:0 0 24px">
      ${button(input.whatsappUrl, "Conversar no WhatsApp", "#1f7a4d")}
      ${button(input.panelUrl, "Ver no painel", "#b4441a")}
    </p>
    ${sections
      .map(
        ([title, rows]) =>
          `<h2 style="margin:20px 0 8px;font-size:17px">${escapeHtml(title)}</h2>` +
          `<table role="presentation" style="border-collapse:collapse;width:100%">${rows.map(rowHtml).join("")}</table>`,
      )
      .join("\n    ")}
    <p style="margin:24px 0 0;color:#6b5560;font-size:13px">Responda este e-mail para escrever direto para o cliente.</p>
  </div>
</body>
</html>`;

  const text = [
    `Nova solicitação ${input.number}`,
    `${customer.name} pediu um orçamento pelo site.`,
    "",
    ...sections.flatMap(([title, rows]) => [title.toUpperCase(), ...rows.map(([l, v]) => `${l}: ${v}`), ""]),
    `Conversar no WhatsApp: ${input.whatsappUrl}`,
    `Ver no painel: ${input.panelUrl}`,
  ].join("\n");

  return { subject, html, text };
}
