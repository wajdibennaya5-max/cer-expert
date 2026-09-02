import { Icon } from "@/components/icons";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Bandeau défilant des zones d'intervention.
 * Le contenu est dupliqué une fois pour que la boucle soit continue ; le second
 * exemplaire est masqué aux lecteurs d'écran.
 */
export function AreasBand({ areas, dict }: { areas: string[]; dict: Dictionary }) {
  if (areas.length === 0) return null;
  const items = [...areas, ...areas];

  return (
    <div className="overflow-hidden border-y border-mist-200 bg-white py-4">
      <div className="flex items-center gap-4">
        <span className="ms-5 hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:flex">
          <Icon name="home" size={15} />
          {dict.contact.areasTitle}
        </span>
        <div className="marquee-track gap-8" aria-hidden="false">
          {items.map((area, index) => (
            <span
              key={`${area}-${index}`}
              aria-hidden={index >= areas.length}
              className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-slate-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-aqua-400" />
              {area}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
