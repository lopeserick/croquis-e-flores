import type { Metadata } from "next";

// Painel da Carla: fora dos buscadores e sem o cabeçalho e o rodapé do site.
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel · Croquis e Flores" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-cream text-plum">{children}</div>;
}
