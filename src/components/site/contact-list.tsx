import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/ui/icons";
import { CONTACT_WHATSAPP_MESSAGE, instagramUrl, whatsappUrl } from "@/features/settings/contact-links";
import type { SiteSettings } from "@/features/settings/site-settings";

type ContactListProps = {
  settings: Pick<SiteSettings, "instagramHandle" | "whatsappNumber" | "contactEmail">;
  /** Cores para fundo escuro (rodapé) ou claro (página de contato). */
  tone?: "dark" | "light";
};

/**
 * WhatsApp, Instagram e e-mail. Contato ainda não configurado aparece como
 * pendência entre colchetes, sem link, para não haver botão que não funciona.
 */
export function ContactList({ settings, tone = "dark" }: ContactListProps) {
  const link =
    tone === "dark"
      ? "text-blush no-underline hover:text-apricot"
      : "text-plum no-underline hover:text-rose";
  const pending = tone === "dark" ? "text-mauve" : "text-plum-muted";
  const item = "inline-flex min-h-11 items-center gap-2";

  return (
    <ul className="flex flex-col">
      <li>
        {settings.whatsappNumber ? (
          <a href={whatsappUrl(settings.whatsappNumber, CONTACT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer" className={`${item} ${link}`}>
            <WhatsAppIcon size={18} />
            WhatsApp<span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : (
          <span className={`${item} ${pending}`}>
            <WhatsAppIcon size={18} />
            [WhatsApp do ateliê]
          </span>
        )}
      </li>
      <li>
        <a href={instagramUrl(settings.instagramHandle)} target="_blank" rel="noopener noreferrer" className={`${item} ${link}`}>
          <InstagramIcon size={18} />
          Instagram<span className="sr-only"> @{settings.instagramHandle} (abre em nova aba)</span>
        </a>
      </li>
      <li>
        {settings.contactEmail ? (
          <a href={`mailto:${settings.contactEmail}`} className={`${item} ${link}`}>
            <MailIcon size={18} />
            {settings.contactEmail}
          </a>
        ) : (
          <span className={`${item} ${pending}`}>
            <MailIcon size={18} />
            [e-mail do ateliê]
          </span>
        )}
      </li>
    </ul>
  );
}
