"use client";

import { Suspense, useRef } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { CloseIcon, InstagramIcon, MenuIcon } from "@/components/ui/icons";
import { instagramUrl } from "@/features/settings/contact-links";
import { ORDER_HREF } from "@/features/site/navigation";
import { MainNav } from "./main-nav";
import { SearchForm } from "./search-form";

/**
 * Menu do celular em <dialog> modal: o navegador cuida do foco preso no
 * painel, do Esc para fechar e de devolver o foco ao botão que abriu.
 */
export function MobileMenu({ instagramHandle }: { instagramHandle: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => dialogRef.current?.close();
  const restoreScroll = () => {
    document.documentElement.style.overflow = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="-ml-2.5 inline-flex size-11 items-center justify-center text-plum"
      >
        <MenuIcon size={24} />
        <span className="sr-only">Abrir menu</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={restoreScroll}
        onClick={(event) => {
          // Clique no fundo escurecido (fora do painel) fecha o menu.
          if (event.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-none w-[min(88vw,360px)] max-w-none bg-cream p-0 text-plum backdrop:bg-plum/50"
      >
        <div className="flex h-full flex-col gap-6 overflow-y-auto px-5 pt-3 pb-8">
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl">Menu</span>
            <button
              type="button"
              onClick={close}
              className="-mr-2.5 inline-flex size-11 items-center justify-center"
            >
              <CloseIcon size={24} />
              <span className="sr-only">Fechar menu</span>
            </button>
          </div>

          <SearchForm id="busca-menu" />

          <nav aria-label="Principal">
            <Suspense fallback={<MainNav orientation="vertical" withActiveState={false} onNavigate={close} />}>
              <MainNav orientation="vertical" onNavigate={close} />
            </Suspense>
          </nav>

          <ButtonLink href={ORDER_HREF} onClick={close} className="w-full">
            Encomende já
          </ButtonLink>

          <a
            href={instagramUrl(instagramHandle)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-plum-muted no-underline hover:text-rose"
          >
            <InstagramIcon size={18} />
            @{instagramHandle} no Instagram
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </dialog>
    </>
  );
}
