import { whatsappUrl } from "@/features/settings/contact-links";

// Links do WhatsApp com mensagem pronta, em tom carinhoso (pedido da Carla).
// A pessoa pode editar o texto antes de enviar; nada é enviado sozinho.

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

const waLink = (number: string, text: string) => whatsappUrl(number, text);

/** Cliente → artista, na tela de "pedido enviado". null se o WhatsApp não foi configurado. */
export function customerWhatsappLink(
  artistNumber: string | null,
  order: { number: string; customerName: string },
): string | null {
  if (!artistNumber) return null;
  return waLink(
    artistNumber,
    `Oi, Carla! 🌸 Aqui é ${firstName(order.customerName)}. Acabei de enviar pelo site o meu pedido ${order.number} ` +
      `e mal posso esperar para ver a minha ideia virar arte! ✨ Fico no aguardo do orçamento 💛`,
  );
}

/** Artista → cliente (e-mail do pedido e painel). Recebe o número já com 55. */
export function artistToCustomerLink(customerNumber: string, orderNumber: string, customerName: string): string {
  return waLink(
    customerNumber,
    `Oi, ${firstName(customerName)}! 🌷 Aqui é a Carla, do Croquis e Flores. Que alegria receber o seu pedido ` +
      `${orderNumber}! ✨ Vamos conversar sobre os detalhes e o orçamento? 💛`,
  );
}
