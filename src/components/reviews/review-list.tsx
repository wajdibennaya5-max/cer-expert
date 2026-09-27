import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { ReviewCard } from "./review-card";
import { reviewDateLabel, sortReviews } from "@/lib/reviews";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Review } from "@/lib/store/types";

export function ReviewList({ reviews, locale, dict }: { reviews: Review[]; locale: Locale; dict: Dictionary }) {
  if (reviews.length === 0) {
    return <p className="mt-10 text-center text-sm text-slate-500">{dict.reviews.empty}</p>;
  }

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {sortReviews(reviews).map((review, index) => (
        <Reveal key={review.id} delay={index * 60} className="h-full">
          <ReviewCard review={review} locale={locale} dict={dict} dateLabel={reviewDateLabel(review, locale)} />
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
