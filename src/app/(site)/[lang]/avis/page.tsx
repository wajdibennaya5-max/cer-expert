import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { ReviewList, ModerationNote } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { Stars } from "@/components/reviews/stars";
import { CtaBand } from "@/components/home/cta-band";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { site } from "@/lib/site";
import { store } from "@/lib/store";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return {
    title: dict.meta.reviews.title,
    description: dict.meta.reviews.description,
    alternates: {
      canonical: `${site.url}/${lang}/avis`,
      languages: Object.fromEntries(locales.map((item) => [item, `${site.url}/${item}/avis`])),
    },
  };
}

export default async function ReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const reviews = await store.listPublishedReviews();

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length) * 10) / 10
      : 0;
  const hasSamples = reviews.some((review) => review.isSample);

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
        {reviews.length > 0 ? (
          <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5">
            <span className="font-display text-3xl font-extrabold text-white">{average}</span>
            <span>
              <Stars rating={Math.round(average)} size={17} />
              <span className="mt-1 block text-xs text-slate-400">
                {reviews.length} {dict.nav.reviews.toLowerCase()}
              </span>
            </span>
          </div>
        ) : null}
      </PageHeader>

      <Section tone="mist">
        <div className="container-page">
          {hasSamples ? (
            <p className="mx-auto mb-8 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-mist-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-600">
              <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-slate-400" />
              {dict.reviews.sampleNote}
            </p>
          ) : null}
          <ReviewList reviews={reviews} locale={locale} dict={dict} />
          <ModerationNote dict={dict} />
        </div>
      </Section>

      <Section>
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
