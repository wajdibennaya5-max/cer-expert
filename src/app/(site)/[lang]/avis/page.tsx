import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { ModerationNote } from "@/components/reviews/review-list";
import { ReviewsBrowser } from "@/components/reviews/reviews-browser";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { Stars } from "@/components/reviews/stars";
import { CtaBand } from "@/components/home/cta-band";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { countLabel, formatAverage, reviewDateLabel, reviewStats, sortReviews } from "@/lib/reviews";
import { store } from "@/lib/store";
import { localizedMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "avis",
    title: dict.meta.reviews.title,
    description: dict.meta.reviews.description,
  });
}

export default async function ReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const reviews = sortReviews(await store.listPublishedReviews());

  // Les chiffres ne portent que sur les avis réels : voir `lib/reviews.ts`.
  const stats = reviewStats(reviews);
  const hasSamples = reviews.some((review) => review.isSample);
  const dateLabels = Object.fromEntries(reviews.map((review) => [review.id, reviewDateLabel(review, locale)]));

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.reviews}
        title={dict.reviews.title}
        subtitle={dict.reviews.subtitle}
        breadcrumb={[{ label: dict.nav.reviews }]}
      >
        {stats.count > 0 ? (
          <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5">
            <span className="font-display text-3xl font-extrabold text-white">
              {formatAverage(stats.average, locale)}
            </span>
            <span>
              <Stars rating={Math.round(stats.average)} size={17} />
              <span className="mt-1 block text-xs text-slate-400">
                {countLabel(stats.count, dict.reviews.countOne, dict.reviews.countMany)}
              </span>
            </span>
          </div>
        ) : null}
      </PageHeader>

      <Section tone="mist">
        <div className="container-page">
          <ReviewSummary
            stats={stats}
            locale={locale}
            dict={dict}
            leaveHref="#laisser-un-avis"
            showSampleNote={hasSamples}
          />

          {hasSamples ? (
            <p className="mx-auto mt-8 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-mist-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-600">
              <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-slate-500" />
              {dict.reviews.sampleNote}
            </p>
          ) : null}

          {reviews.length > 0 ? (
            <div className="mt-10">
              <ReviewsBrowser reviews={reviews} dateLabels={dateLabels} locale={locale} dict={dict} />
            </div>
          ) : null}
          <ModerationNote dict={dict} />
        </div>
      </Section>

      <Section id="laisser-un-avis">
        <div className="container-page">
          <SectionHeading title={dict.reviews.leaveTitle} subtitle={dict.reviews.leaveSubtitle} />
          <div className="mx-auto mt-10 max-w-2xl">
            <ReviewForm locale={locale} dict={dict} />
          </div>
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
