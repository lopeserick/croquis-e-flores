export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Galeria", href: "/galeria" },
  { label: "Tipos de obra", href: "/tipos-de-obra" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Sobre a artista", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

export const footerNav: NavItem[] = mainNav.filter((item) =>
  ["/galeria", "/tipos-de-obra", "/#como-funciona", "/sobre"].includes(item.href),
);

export const legalNav: NavItem[] = [
  { label: "Política de privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
];

export const ORDER_HREF = "/encomendar";

/** Item do menu que corresponde à página atual. Âncoras nunca ficam ativas. */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
