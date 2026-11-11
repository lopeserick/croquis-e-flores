// Links de contato montados a partir das configurações. Sem dados: pode ser
// importado também por componentes do navegador.

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}/`;
}

/** Mensagem pronta do botão de WhatsApp do site (a pessoa pode editar antes de enviar). */
export const CONTACT_WHATSAPP_MESSAGE =
  "Oi, Carla! 🌸 Vim pelo site da Croquis e Flores e quero conversar sobre uma arte personalizada ✨";

/** Conversa no WhatsApp. O número deve vir com DDI (55); a mensagem é opcional. */
export function whatsappUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
