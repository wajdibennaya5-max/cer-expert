import { Stars } from "./stars";
import { serviceName } from "@/content/services";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Review } from "@/lib/store/types";

/**
 * Carte d'avis.
 *
 * Sans directive « use client » et sans état : elle se rend aussi bien depuis
 * une page serveur que depuis la liste paginée, qui est un composant client.
 * La date arrive déjà formatée, pour la raison expliquée dans `lib/reviews.ts`.
 */
export function ReviewCard({
  review,
  locale,
  dict,
  dateLabel,
}: {
  review: Review;
  locale: Locale;
  dict: Dictionary;
  dateLabel?: string;
}) {
  const context = [review.area, review.serviceSlug ? serviceName(review.serviceSlug, locale) : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <figure className="lift flex h-full flex-col rounded-3xl border border-mist-200 bg-white p-6 shadow-card transition hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Stars rating={review.rating} />
          <span className="sr-only">
            {review.rating} {dict.reviews.ratingSuffix}
          </span>
        </span>
        {review.isSample ? (
          <span className="rounded-full border border-mist-200 bg-mist-100 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-slate-600">
            {dict.reviews.sampleBadge}
          </span>
        ) : dateLabel ? (
          <span className="text-xs text-slate-500">
            <span className="sr-only">{dict.reviews.publishedOn} </span>
            {dateLabel}
          </span>
        ) : null}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">“{review.comment}”</blockquote>
      {review.reply ? (
        <p className="mt-4 rounded-2xl bg-aqua-50 p-3.5 text-xs leading-relaxed text-aqua-800">
          <span className="font-bold">Wajdi &amp; Tayssir : </span>
          {review.reply}
        </p>
      ) : null}
      <figcaption className="mt-5 flex items-center gap-3 border-t border-mist-100 pt-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white"
        >
          {review.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink-900">{review.name}</span>
          {context ? <span className="block truncate text-xs text-slate-500">{context}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}
