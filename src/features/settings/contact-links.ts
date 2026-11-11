// Links de contato montados a partir das configurações. Sem dados: pode ser
// importado também por componentes do navegador.

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}/`;
}

/** Conversa no WhatsApp. O número deve vir com DDI (55) e só dígitos. */
export function whatsappUrl(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}
