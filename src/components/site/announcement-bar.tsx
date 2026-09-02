"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

const KEY = "wtsp.announcement.dismissed";

/**
 * Bandeau d'annonce, piloté depuis la console d'administration.
 * Refermable : une fois écarté, il ne réapparaît pas de la session — un bandeau
 * qu'on ne peut pas fermer devient vite une nuisance.
 */
export function AnnouncementBar({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(KEY) !== text);
    } catch {
      setVisible(true);
    }
  }, [text]);

  if (!visible) return null;

  return (
    <div className="no-print relative bg-gradient-to-r from-aqua-600 via-aqua-500 to-volt-500 text-ink-950">
      <div className="container-page flex items-center gap-3 py-2 text-center text-[0.78rem] font-semibold sm:text-sm">
        <Icon name="spark" size={16} className="hidden shrink-0 sm:block" />
        <p className="flex-1 text-balance">{text}</p>
        <a
          href={telHref}
          className="hidden shrink-0 rounded-full bg-ink-950/85 px-3 py-1 font-bold text-white sm:inline-block"
        >
          <PhoneText />
        </a>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => {
            setVisible(false);
            try {
              sessionStorage.setItem(KEY, text);
            } catch {
              /* sans conséquence */
            }
          }}
          className="shrink-0 rounded-full p-1 transition hover:bg-ink-950/10"
        >
          <Icon name="close" size={15} />
        </button>
      </div>
    </div>
  );
}
