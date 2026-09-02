"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Illustration } from "@/components/illustrations";
import type { GalleryCategory, GalleryItem } from "@/lib/store/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const filterOrder: (GalleryCategory | "all")[] = [
  "all",
  "plomberie",
  "electricite",
  "avant-apres",
  "installations",
  "depannages",
  "realisations",
];

/**
 * Galerie filtrable avec visionneuse.
 *
 * Deux sources d'images cohabitent : les illustrations vectorielles livrées
 * avec le site et les photos réelles téléversées depuis l'administration. Le
 * composant ne fait pas la différence côté mise en page, ce qui permet de
 * remplacer les unes par les autres au fil du temps, sans refonte.
 */
export function GalleryGrid({ items, dict }: { items: GalleryItem[]; dict: Dictionary }) {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [active, setActive] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.category === filter)),
    [filter, items],
  );

  const close = useCallback(() => setActive(null), []);
  const move = useCallback(
    (delta: number) => {
      setActive((current) => {
        if (current === null || visible.length === 0) return current;
        return (current + delta + visible.length) % visible.length;
      });
    },
    [visible.length],
  );

  useEffect(() => {
    if (active === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, move]);

  const current = active !== null ? visible[active] : undefined;

  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {filterOrder.map((key) => {
          const label = key === "all" ? dict.gallery.filters.all : dict.gallery.filters[key];
          const count = key === "all" ? items.length : items.filter((item) => item.category === key).length;
          if (count === 0 && key !== "all") return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setActive(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === key
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-mist-200 bg-white text-slate-600 hover:border-slate-400 hover:text-ink-900"
              }`}
            >
              {label}
              <span className={`ms-2 text-xs ${filter === key ? "text-white/60" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-14 text-center text-sm text-slate-500">{dict.gallery.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${dict.gallery.openItem} — ${item.title}`}
              className="lift group relative overflow-hidden rounded-3xl border border-mist-200 bg-white text-start shadow-card transition hover:shadow-card-hover"
            >
              <span className="block aspect-[4/3] overflow-hidden bg-ink-900">
                {item.kind === "illustration" || !item.mediaId ? (
                  <Illustration
                    name={item.illustration ?? "faucet-scene"}
                    title={item.title}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/media/${item.mediaId}`}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </span>
              <span className="block p-5">
                <span className="inline-flex rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                  {dict.gallery.filters[item.category]}
                </span>
                <span className="mt-3 block text-base font-bold leading-snug text-ink-900">{item.title}</span>
                {item.description ? (
                  <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">{item.description}</span>
                ) : null}
              </span>
              <span className="pointer-events-none absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/60 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                <Icon name="plus" size={17} />
              </span>
            </button>
          ))}
        </div>
      )}

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/92 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label={dict.gallery.close}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/16"
          >
            <Icon name="close" size={20} />
          </button>

          {visible.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  move(-1);
                }}
                aria-label={dict.gallery.previous}
                className="absolute start-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/16"
              >
                <Icon name="chevronRight" size={20} className="rotate-180 rtl:rotate-0" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  move(1);
                }}
                aria-label={dict.gallery.next}
                className="absolute end-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/16"
              >
                <Icon name="chevronRight" size={20} className="rtl:rotate-180" />
              </button>
            </>
          ) : null}

          <figure
            className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/12 bg-ink-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="aspect-[4/3] bg-ink-950">
              {current.kind === "illustration" || !current.mediaId ? (
                <Illustration
                  name={current.illustration ?? "faucet-scene"}
                  title={current.title}
                  className="h-full w-full"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/media/${current.mediaId}`}
                  alt={current.title}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <figcaption className="border-t border-white/10 p-5">
              <p className="text-base font-bold text-white">{current.title}</p>
              {current.description ? <p className="mt-1.5 text-sm text-slate-400">{current.description}</p> : null}
              <p className="mt-3 text-[0.7rem] uppercase tracking-wider text-slate-500">
                {dict.gallery.filters[current.category]}
                {current.kind === "illustration" ? ` · ${dict.gallery.illustrationNote}` : ""}
              </p>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
