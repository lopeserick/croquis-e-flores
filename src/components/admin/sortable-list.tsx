import Link from "next/link";
import type { ReactNode } from "react";
import { iconButton } from "@/components/admin/admin-ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

/** Lista com subir/descer (a ordem é a mesma do site). */
export function SortableList({
  items,
  move,
}: {
  items: { id: string; name: string; href: string; details?: string; pills?: ReactNode[] }[];
  move: (formData: FormData) => Promise<void>;
}) {
  if (items.length === 0) return <p className="text-sm text-plum-muted">Nada cadastrado ainda.</p>;
  return (
    <ol className="flex flex-col divide-y divide-border">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <Link href={item.href} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline">
              {item.name}
            </Link>
            {item.details && <p className="text-sm text-plum-muted">{item.details}</p>}
            {item.pills && item.pills.length > 0 && <p className="mt-1 flex flex-wrap gap-1.5">{item.pills}</p>}
          </div>
          <form action={move} className="flex shrink-0 gap-1">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" name="direction" value="up" disabled={index === 0} className={iconButton}>
              <ArrowLeftIcon size={16} className="rotate-90" />
              <span className="sr-only">Subir {item.name}</span>
            </button>
            <button type="submit" name="direction" value="down" disabled={index === items.length - 1} className={iconButton}>
              <ArrowRightIcon size={16} className="rotate-90" />
              <span className="sr-only">Descer {item.name}</span>
            </button>
          </form>
        </li>
      ))}
    </ol>
  );
}
