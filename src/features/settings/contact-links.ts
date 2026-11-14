// Links de contato montados a partir das configurações. Sem dados: pode ser
// importado também por componentes do navegador.

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}/`;
}

/** Mensagem pronta do botão de WhatsApp do site (a pessoa pode editar antes de enviar). */
export const CONTACT_WHATSAPP_MESSAGE =
  "Oi, Carla! 🌸 Vim pelo site da Croquis e Flores e quero conversar sobre uma arte personalizada ✨";

/**
 * Conversa no WhatsApp. O número deve vir com DDI (55); a mensagem é opcional.
 *
 * Usa api.whatsapp.com/send, e não wa.me: o redirecionamento do wa.me estraga
 * emojis fora do básico (🌸, 💛, 🌷), que chegavam como "�" no WhatsApp Web e
 * no aplicativo do computador. O texto vai em UTF-8 codificado.
 */
export function whatsappUrl(number: string, message?: string): string {
  const params = new URLSearchParams({ phone: number.replace(/\D/g, "") });
  const base = `https://api.whatsapp.com/send?${params}`;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}
