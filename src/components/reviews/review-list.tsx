import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { Stars } from "./stars";
import { serviceName } from "@/content/services";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Review } from "@/lib/store/types";

export function ReviewList({ reviews, locale, dict }: { reviews: Review[]; locale: Locale; dict: Dictionary }) {
  if (reviews.length === 0) {
    return <p className="mt-10 text-center text-sm text-slate-500">{dict.reviews.empty}</p>;
  }

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review, index) => (
        <Reveal key={review.id} delay={index * 60} className="h-full">
          <figure className="lift flex h-full flex-col rounded-3xl border border-mist-200 bg-white p-6 shadow-card transition hover:shadow-card-hover">
            <div className="flex items-center justify-between gap-3">
              <Stars rating={review.rating} />
              {review.isSample ? (
                <span className="rounded-full border border-mist-200 bg-mist-100 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-slate-600">
                  {dict.reviews.sampleBadge}
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
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {review.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink-900">{review.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {[review.area, review.serviceSlug ? serviceName(review.serviceSlug, locale) : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

export function ModerationNote({ dict }: { dict: Dictionary }) {
  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
      <Icon name="shield" size={14} />
      {dict.reviews.moderation}
    </p>
  );
}
