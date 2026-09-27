"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref, whatsappHref } from "@/lib/site";
import { openAssistant } from "@/components/assistant/assistant-bus";

/**
 * Barre d'action fixe, mobile uniquement.
 *
 * Sur téléphone, un visiteur en situation d'urgence ne doit jamais avoir à
 * chercher le bouton d'appel : il reste à portée de pouce sur toutes les pages.
 *
 * Quatre actions, dans l'ordre où on les choisit : appeler quand c'est urgent,
 * WhatsApp pour envoyer une photo du problème, le devis quand on a le temps de
 * décrire, l'assistant quand on ne sait pas encore quoi demander. Chaque case
 * garde au moins 44 px de haut, la taille minimale d'une cible tactile.
 */
export function MobileActionBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const base =
    "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[0.68rem] font-bold leading-none transition active:scale-95";

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="border-t border-white/10 bg-ink-950/92 px-2.5 pb-[env(safe-area-inset-bottom)] pt-2.5 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-2 pb-2.5">
          <a
            href={telHref}
            data-cta="call-mobile-bar"
            className={`${base} bg-gradient-to-b from-volt-300 to-volt-500 text-ink-950`}
          >
            <Icon name="phone" size={19} />
            {dict.cta.call}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="whatsapp-mobile-bar"
            className={`${base} bg-emerald-700 text-white`}
          >
            <Icon name="whatsapp" size={19} />
            {dict.cta.whatsapp}
          </a>
          <Link
            href={localePath(locale, "demande")}
            className={`${base} bg-gradient-to-b from-aqua-300 to-aqua-500 text-ink-950`}
          >
            <Icon name="spark" size={19} />
            {dict.cta.requestShort}
          </Link>
          <button
            type="button"
            onClick={() => openAssistant()}
            className={`${base} border border-white/15 bg-white/8 text-white`}
          >
            <Icon name="send" size={19} />
            {dict.cta.assistantShort}
          </button>
        </div>
      </div>
    </div>
  );
}
