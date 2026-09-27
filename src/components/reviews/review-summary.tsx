import Link from "next/link";
import { Icon } from "@/components/icons";
import { Stars } from "./stars";
import { countLabel, formatAverage, type ReviewStats } from "@/lib/reviews";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Synthèse des avis : note moyenne, total et répartition par étoiles.
 *
 * Elle reçoit des statistiques déjà filtrées (`reviewStats`), donc calculées
 * sur les seuls avis réels. Sans avis réel, elle ne fabrique rien : elle le
 * dit, et invite le premier client à écrire le sien.
 */
export function ReviewSummary({
  stats,
  locale,
  dict,
  leaveHref,
  showSampleNote = false,
}: {
  stats: ReviewStats;
  locale: Locale;
  dict: Dictionary;
  /** Ancre ou page du formulaire d'avis. */
  leaveHref: string;
  /** Rappelle que les exemples affichés ne comptent pas. */
  showSampleNote?: boolean;
}) {
  if (stats.count === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-dashed border-mist-300 bg-white px-6 py-10 text-center shadow-card sm:px-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-volt-50 text-volt-600">
          <Icon name="star" size={24} />
        </span>
        <h2 className="text-xl font-extrabold text-ink-900">{dict.reviews.noneYetTitle}</h2>
        <p className="max-w-xl text-sm leading-relaxed text-slate-600">{dict.reviews.noneYetText}</p>
        <Link
          href={leaveHref}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {dict.reviews.leaveTitle}
          <Icon name="arrowRight" size={15} className="rtl:rotate-180" />
        </Link>
        {showSampleNote ? <p className="text-xs text-slate-500">{dict.reviews.samplesExcluded}</p> : null}
      </div>
    );
  }

  const max = Math.max(...stats.distribution.map((entry) => entry.count), 1);

  return (
    <div className="mx-auto grid max-w-4xl gap-8 rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
      <div className="flex flex-col items-center text-center md:items-start md:text-start">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{dict.reviews.average}</span>
        <span className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold leading-none text-ink-900">
            {formatAverage(stats.average, locale)}
          </span>
          <span className="text-sm font-semibold text-slate-500">/ 5</span>
        </span>
        <span className="mt-3">
          <Stars rating={Math.round(stats.average)} size={20} />
        </span>
        <span className="mt-2 text-sm text-slate-600">
          {countLabel(stats.count, dict.reviews.countOne, dict.reviews.countMany)}
        </span>
      </div>

      <div>
        <h2 className="text-sm font-bold text-ink-900">{dict.reviews.distribution}</h2>
        <ul className="mt-4 space-y-2.5">
          {stats.distribution.map((entry) => {
            const label = countLabel(entry.rating, dict.reviews.starsOne, dict.reviews.starsMany);
            return (
              <li key={entry.rating} className="grid grid-cols-[3.25rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span aria-hidden="true">{entry.rating}</span>
                  <Icon name="star" size={14} filled className="text-volt-400" />
                  <span className="sr-only">{label}</span>
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-mist-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-volt-300 to-volt-500"
                    style={{ width: `${(entry.count / max) * 100}%` }}
                  />
                </span>
                <span className="text-end tabular-nums text-slate-500">{entry.count}</span>
              </li>
            );
          })}
        </ul>
        {showSampleNote ? <p className="mt-4 text-xs text-slate-500">{dict.reviews.samplesExcluded}</p> : null}
      </div>
    </div>
  );
}
