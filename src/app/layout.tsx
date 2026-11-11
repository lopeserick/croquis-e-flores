import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { SITE_NAME } from "@/features/site/seo";
import { getEnv } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Croquis de moda, retratos e ilustrações sob encomenda, criados pela artista Carla.";

export const metadata: Metadata = {
  // Base dos endereços absolutos (prévia de link, canônico, sitemap).
  metadataBase: new URL(getEnv("site").NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${SITE_NAME} · Arte personalizada`,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Arte personalizada`,
    description,
    url: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${jost.variable} ${pinyon.variable}`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
