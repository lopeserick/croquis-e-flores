import { AdminHeader } from "@/components/admin/admin-header";

// Cabeçalho do painel. A permissão é conferida dentro de cada página (e de
// cada ação), não só aqui: um layout não roda de novo em toda navegação.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-plum focus:px-5 focus:py-3 focus:text-cream"
      >
        Pular para o conteúdo
      </a>
      <AdminHeader />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
