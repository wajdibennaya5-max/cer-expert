"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const KEY = "wtsp.welcome.seen";

/**
 * Message de bienvenue au premier passage.
 *
 * Affiché une seule fois par navigateur, après un court délai pour ne pas
 * couvrir la page d'accueil dès la première seconde. Le contenu vient des
 * paramètres : l'entreprise décide de ce qui est annoncé, le site ne promet
 * jamais une réduction de son propre chef.
 */
export function WelcomeBonus({
  locale,
  dict,
  title,
  text,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  text: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      seen = true;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setVisible(true), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* sans conséquence */
    }
  }

  if (!visible) return null;

  return (
    <div className="no-print fixed bottom-24 start-4 z-40 max-w-[19rem] animate-[rise_0.6s_cubic-bezier(0.16,1,0.3,1)] lg:bottom-6 lg:start-6">
      <div className="gradient-border overflow-hidden rounded-3xl bg-ink-900/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-volt-300 to-volt-500 text-ink-950">
            <Icon name="gift" size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{title || dict.rewards.welcomeTitle}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{text}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Link href={localePath(locale, "services")} onClick={dismiss} className={button("primary", "sm", "flex-1")}>
            {dict.rewards.discover}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            {dict.rewards.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
