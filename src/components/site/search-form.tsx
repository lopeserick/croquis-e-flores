import Form from "next/form";
import { SearchIcon } from "@/components/ui/icons";

/** Busca de obras do cabeçalho. Envia para a galeria (?q=). */
export function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  return (
    <Form action="/galeria" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Buscar obras
      </label>
      <div className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-cream px-4 text-plum-muted focus-within:border-plum">
        <SearchIcon size={18} />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Buscar obras"
          autoComplete="off"
          className="w-full min-w-0 bg-transparent text-[13px] text-plum placeholder:text-plum-muted focus:outline-none"
        />
      </div>
    </Form>
  );
}
