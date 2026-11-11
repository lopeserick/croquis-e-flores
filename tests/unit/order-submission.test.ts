import { describe, expect, it, vi } from "vitest";
import { buildOrderEmail, escapeHtml, type OrderEmailInput } from "@/features/orders/email-template";
import { CUSTOM_CATEGORY } from "@/features/orders/form-types";
import { buildOrderRecord } from "@/features/orders/order-record";
import { sendEmail, type EmailMessage } from "@/features/orders/send-email";
import {
  idempotencyKeySchema,
  isReferencePathFor,
  newIdempotencyKey,
  referencePath,
  submitOrderSchema,
} from "@/features/orders/submission";
import { summarizeOrder } from "@/features/orders/summary";
import { artistToCustomerLink, customerWhatsappLink } from "@/features/orders/whatsapp";
import { clientIp, hashIp } from "@/lib/security/ip-hash";
import { complete, ctx } from "./fixtures/order";

describe("chave do pedido (idempotência)", () => {
  it("gera UUID v4 válido e diferente a cada rascunho", () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(idempotencyKeySchema.safeParse(a).success).toBe(true);
    expect(a).not.toBe(b);
  });

  it("recusa chave em outro formato", () => {
    expect(idempotencyKeySchema.safeParse("123").success).toBe(false);
    expect(idempotencyKeySchema.safeParse("00000000-0000-1000-8000-000000000000").success).toBe(false);
  });
});

describe("caminho das fotos no armazenamento", () => {
  const key = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";

  it("fica dentro da pasta do pedido, com a extensão do tipo real", () => {
    const path = referencePath(key, 2, "image/webp", "a1b2c3d4e5f60708");
    expect(path).toBe(`${key}/2-a1b2c3d4e5f60708.webp`);
    expect(isReferencePathFor(key, path)).toBe(true);
  });

  it("recusa caminho de outro pedido ou que tenta sair da pasta", () => {
    const other = "9c4e28ba-2fa1-41d2-883f-0016d3cca427";
    expect(isReferencePathFor(key, `${other}/1-a1b2c3d4.png`)).toBe(false);
    expect(isReferencePathFor(key, `${key}/../${other}/1-a1b2c3d4.png`)).toBe(false);
    expect(isReferencePathFor(key, `${key}/1-a1b2c3d4.html`)).toBe(false);
  });

  it("envio do pedido aceita no máximo 20 fotos e exige o campo-armadilha", () => {
    const base = { idempotencyKey: newIdempotencyKey(), draft: {}, website: "" };
    const refs = Array.from({ length: 21 }, (_, i) => ({ path: `x/${i}`, name: "f.png" }));
    expect(submitOrderSchema.safeParse({ ...base, references: refs }).success).toBe(false);
    expect(submitOrderSchema.safeParse({ ...base, references: [] }).success).toBe(true);
  });
});

describe("WhatsApp", () => {
  it("cliente abre conversa com a artista já com o número do pedido", () => {
    const url = customerWhatsappLink("5575988498356", { number: "CF-2026-0007", customerName: "Maria Souza" });
    expect(url).toMatch(/^https:\/\/wa\.me\/5575988498356\?text=/);
    const text = decodeURIComponent(url!.split("text=")[1]);
    expect(text).toBe(
      "Oi, Carla! 🌸 Aqui é Maria. Acabei de enviar pelo site o meu pedido CF-2026-0007 e mal posso esperar para ver a minha ideia virar arte! ✨ Fico no aguardo do orçamento 💛",
    );
  });

  it("sem WhatsApp configurado, não há botão", () => {
    expect(customerWhatsappLink(null, { number: "CF-2026-0007", customerName: "Maria" })).toBeNull();
  });

  it("texto com caracteres especiais vai codificado no link", () => {
    const url = artistToCustomerLink("5511912345678", "CF-2026-0001", "Ana & Júlia");
    expect(url).not.toContain(" ");
    expect(url).not.toContain("&J");
    expect(decodeURIComponent(url.split("text=")[1])).toMatch(/^Oi, Ana! 🌷 Aqui é a Carla/);
  });
});

describe("registro do pedido", () => {
  const summary = summarizeOrder(complete, ctx);
  const record = buildOrderRecord(complete, ctx, summary, {
    idempotencyKey: "1b4e28ba-2fa1-41d2-883f-0016d3cca427",
    ipHash: "hash",
  });

  it("guarda ids e uma cópia em texto das escolhas", () => {
    expect(record).toMatchObject({
      size_option_id: "20x30",
      technique_option_id: "nanquim",
      finish_option_id: "com",
      delivery_option_id: "retirada",
      file_format_option_id: null,
    });
    expect(record.choices).toEqual({ obra: summary.work, detalhes: summary.details });
    expect(summary.details).toContainEqual(["Tamanho", "Folha 20 × 30 cm (R$ 100)"]);
    expect(summary.details).toContainEqual(["Moldura", "Com moldura (+ R$ 50)"]);
  });

  it("normaliza contato: WhatsApp só com dígitos, e-mail minúsculo, nome sem espaços extras", () => {
    const messy = buildOrderRecord(
      { ...complete, name: "  Maria   Souza ", email: " Maria@Exemplo.COM ", whatsapp: "(75) 98849-8356" },
      ctx,
      summary,
      { idempotencyKey: "k", ipHash: "h" },
    );
    expect(messy).toMatchObject({
      customer_name: "Maria Souza",
      customer_email: "maria@exemplo.com",
      customer_whatsapp: "75988498356",
    });
  });

  it("tema personalizado não aponta para coleção; texto livre só com opção que pede", () => {
    const custom = buildOrderRecord(
      { ...complete, categoryId: CUSTOM_CATEGORY, customTechnique: "carvão" },
      ctx,
      summary,
      { idempotencyKey: "k", ipHash: "h" },
    );
    expect(custom.category_id).toBeNull();
    expect(custom.custom_technique).toBeNull(); // nanquim não abre campo livre
  });

  it("autorização de portfólio só vale quando a pergunta está ligada", () => {
    const off = { ...ctx, data: { ...ctx.data, settings: { ...ctx.data.settings, askPortfolioConsent: false } } };
    const record = buildOrderRecord({ ...complete, portfolioConsent: true }, off, summary, {
      idempotencyKey: "k",
      ipHash: "h",
    });
    expect(record.portfolio_consent).toBe(false);
  });
});

describe("e-mail para a artista", () => {
  const input: OrderEmailInput = {
    number: "CF-2026-0001",
    summary: summarizeOrder(complete, ctx),
    desiredDate: "2026-12-20",
    description: "Retrato da minha avó <b>no jardim</b>",
    customer: {
      name: `<script>alert("x")</script> Souza`,
      email: "maria@exemplo.com",
      whatsapp: "75988498356",
      city: "Feira de Santana",
      state: "BA",
      notes: "",
      portfolioConsent: true,
    },
    referenceCount: 2,
    panelUrl: "https://croquiseflores.com.br/admin/pedidos/abc",
    whatsappUrl: "https://wa.me/5575988498356?text=Ol%C3%A1&x=1",
  };

  it("escapa todo texto vindo do cliente (sem HTML injetado)", () => {
    const { html } = buildOrderEmail(input);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>no jardim</b>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;no jardim&lt;/b&gt;");
    expect(escapeHtml(`"'&`)).toBe("&quot;&#39;&amp;");
  });

  it("assunto com número do pedido e cliente; corpo com escolhas, data, fotos e links", () => {
    const { subject, html, text } = buildOrderEmail({ ...input, customer: { ...input.customer, name: "Maria Souza" } });
    expect(subject).toBe("Nova solicitação CF-2026-0001 · Maria Souza");
    expect(text).toContain("Data desejada: domingo, 20 de dezembro de 2026");
    expect(text).toContain("WhatsApp: (75) 98849-8356");
    expect(text).toContain("Fotos: 2 fotos de referência (abrir no painel)");
    expect(text).toContain("Portfólio: Autorizou mostrar a obra pronta");
    expect(html).toContain('href="https://wa.me/5575988498356?text=Ol%C3%A1&amp;x=1"');
    expect(html).toContain("https://croquiseflores.com.br/admin/pedidos/abc");
  });
});

describe("envio do e-mail (Resend)", () => {
  const message: EmailMessage = { to: "carla@exemplo.com", replyTo: "cliente@exemplo.com", subject: "s", html: "h", text: "t" };
  const config = { apiKey: "re_teste", from: "Croquis e Flores <onboarding@resend.dev>" };

  it("sem chave configurada, não tenta enviar e diz o motivo", async () => {
    const fetchImpl = vi.fn();
    const result = await sendEmail(message, null, fetchImpl);
    expect(result).toEqual({ sent: false, reason: expect.stringMatching(/não configurado/) });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("envia com a chave no cabeçalho e responde para o cliente", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await sendEmail(message, config, fetchImpl)).toEqual({ sent: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer re_teste");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["carla@exemplo.com"], reply_to: "cliente@exemplo.com" });
  });

  it("em desenvolvimento, o destinatário pode ser trocado", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail(message, { ...config, toOverride: "dev@exemplo.com" }, fetchImpl);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).to).toEqual(["dev@exemplo.com"]);
  });

  it("falha do Resend ou da rede vira motivo, sem lançar erro", async () => {
    const refused = vi.fn().mockResolvedValue(new Response("domínio não verificado", { status: 403 }));
    expect(await sendEmail(message, config, refused)).toEqual({
      sent: false,
      reason: "Resend respondeu 403: domínio não verificado",
    });
    const offline = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    expect(await sendEmail(message, config, offline)).toEqual({
      sent: false,
      reason: expect.stringContaining("ECONNRESET"),
    });
  });
});

describe("IP só como hash", () => {
  it("usa o primeiro IP do x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "200.1.2.3, 10.0.0.1" });
    expect(clientIp(headers)).toBe("200.1.2.3");
    expect(clientIp(new Headers())).toBe("desconhecido");
  });

  it("hash muda com o sal e não contém o IP", () => {
    const a = hashIp("200.1.2.3", "sal-a");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("200.1.2.3");
    expect(hashIp("200.1.2.3", "sal-b")).not.toBe(a);
  });
});
