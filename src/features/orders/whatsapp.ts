// Links do WhatsApp (wa.me). Montados no servidor com o número das configurações.

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Conversa do cliente com a artista, já com o número do pedido. null se o WhatsApp não foi configurado. */
export function customerWhatsappLink(
  artistNumber: string | null,
  order: { number: string; customerName: string },
): string | null {
  if (!artistNumber) return null;
  const text = `Olá! Sou ${firstName(order.customerName)} e acabei de enviar pelo site a solicitação de orçamento ${order.number}.`;
  return `https://wa.me/${artistNumber}?text=${encodeURIComponent(text)}`;
}

/** Link para a artista chamar o cliente (no e-mail do pedido). Recebe o número já com 55. */
export function artistToCustomerLink(customerNumber: string, orderNumber: string, customerName: string): string {
  const text = `Olá, ${firstName(customerName)}! Aqui é a Carla, do Croquis e Flores. Recebi sua solicitação ${orderNumber}.`;
  return `https://wa.me/${customerNumber}?text=${encodeURIComponent(text)}`;
}
