"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref } from "@/lib/site";
import { openAssistant } from "@/components/assistant/assistant-bus";

/**
 * Barre d'action fixe, mobile uniquement.
 *
 * Sur téléphone, un visiteur en situation d'urgence ne doit jamais avoir à
 * chercher le bouton d'appel : il reste à portée de pouce sur toutes les pages.
 * Les trois actions couvrent les trois façons de nous joindre.
 */
export function MobileActionBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="border-t border-white/10 bg-ink-950/92 px-3 pb-[env(safe-area-inset-bottom)] pt-2.5 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={telHref}
            data-cta="call-mobile-bar"
            className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-volt-300 to-volt-500 py-2.5 text-[0.7rem] font-bold text-ink-950 active:scale-95"
          >
            <Icon name="phone" size={19} />
            {dict.cta.call}
          </a>
          <Link
            href={localePath(locale, "demande")}
            className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-aqua-300 to-aqua-500 py-2.5 text-[0.7rem] font-bold text-ink-950 active:scale-95"
          >
            <Icon name="spark" size={19} />
            {dict.cta.requestShort}
          </Link>
          <button
            type="button"
            onClick={() => openAssistant()}
            className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/8 py-2.5 text-[0.7rem] font-bold text-white active:scale-95"
          >
            <Icon name="send" size={19} />
            {dict.cta.assistantShort}
          </button>
        </div>
      </div>
    </div>
  );
}
