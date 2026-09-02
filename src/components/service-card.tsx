import Link from "next/link";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import type { Service } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Carte de prestation.
 * Le bleu marque la plomberie, l'ambre l'électricité : le visiteur repère son
 * métier avant même d'avoir lu le titre.
 */
export function ServiceCard({
  service,
  locale,
  dict,
  delay = 0,
}: {
  service: Service;
  locale: Locale;
  dict: Dictionary;
  delay?: number;
}) {
  const isPlumbing = service.category === "plomberie";
  const accent = isPlumbing
    ? {
        chip: "bg-aqua-50 text-aqua-700 border-aqua-200",
        icon: "from-aqua-400 to-aqua-600",
        ring: "hover:border-aqua-300",
      }
    : {
        chip: "bg-volt-50 text-volt-700 border-volt-200",
        icon: "from-volt-300 to-volt-500",
        ring: "hover:border-volt-300",
      };

  return (
    <Reveal delay={delay} className="h-full">
      <article
        className={`lift group relative flex h-full flex-col rounded-3xl border border-mist-200 bg-white p-6 shadow-card transition hover:shadow-card-hover ${accent.ring}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.icon} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}
          >
            <Icon name={service.icon} size={26} />
          </span>
          {service.emergency ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-red-600">
              <Icon name="alert" size={12} />
              {dict.services.emergencyTag}
            </span>
          ) : null}
        </div>

        <h3 className="mt-5 text-lg font-bold leading-snug text-ink-900">{service.name[locale]}</h3>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">{service.short[locale]}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-mist-100 pt-5">
          <Link
            href={localePath(locale, `demande?service=${service.slug}`)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-4 text-[0.8rem] font-semibold text-white transition hover:bg-ink-800"
          >
            {dict.cta.requestThis}
            <Icon name="arrowRight" size={15} className="rtl:rotate-180" />
          </Link>
          <Link
            href={localePath(locale, `services/${service.slug}`)}
            className={`inline-flex h-10 items-center rounded-full border px-4 text-[0.8rem] font-semibold transition ${accent.chip}`}
          >
            {dict.cta.discover}
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
