"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { locales, localeMeta, type Locale } from "@/lib/i18n/config";
import { Icon } from "@/components/icons";

/**
 * Sélecteur de langue.
 * Il conserve la page courante : /fr/services devient /en/services, jamais un
 * retour à l'accueil — un détail qui change tout pour un visiteur qui bascule.
 */
export function LanguageSwitcher({
  locale,
  label,
  compact = false,
}: {
  locale: Locale;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pathFor(target: Locale): string {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return `/${target}`;
    segments[0] = target;
    return `/${segments.join("/")}`;
  }

  const current = localeMeta[locale];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/90 transition hover:bg-white/12 ${
          compact ? "" : "min-w-[5.5rem]"
        }`}
      >
        <Icon name="globe" size={17} className="opacity-80" />
        <span className="uppercase">{locale}</span>
        <Icon name="chevronDown" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/12 bg-ink-850/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {locales.map((item) => (
            <li key={item}>
              <Link
                href={pathFor(item)}
                hrefLang={item}
                role="option"
                aria-selected={item === locale}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  item === locale ? "bg-aqua-500/15 text-aqua-200" : "text-slate-200 hover:bg-white/8"
                }`}
              >
                <span aria-hidden="true" className="text-base">
                  {localeMeta[item].flag}
                </span>
                <span className="font-medium">{localeMeta[item].native}</span>
                {item === locale ? <Icon name="check" size={15} className="ms-auto" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <span className="sr-only">{current.native}</span>
    </div>
  );
}
