import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero } from "@/components/home/hero";
import { AreasBand } from "@/components/home/areas-band";
import { SectionNav } from "@/components/home/section-nav";
import { ServicesPreview } from "@/components/home/services-preview";
import { Trust } from "@/components/home/trust";
import { HowItWorks } from "@/components/home/how-it-works";
import { EmergencyBand } from "@/components/home/emergency-band";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { PracticalInfo } from "@/components/home/practical-info";
import { RewardsPreview } from "@/components/home/rewards";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/home/cta-band";
import { Icon } from "@/components/icons";
import { ReviewList, ModerationNote } from "@/components/reviews/review-list";
import { Stars } from "@/components/reviews/stars";
import { Section, SectionHeading } from "@/components/ui/section";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { countLabel, formatAverage, reviewStats, sortReviews } from "@/lib/reviews";
import { faqJsonLd } from "@/lib/seo";
import { store } from "@/lib/store";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const [settings, gallery, published] = await Promise.all([
    store.getSettings(),
    store.listPublishedGallery(),
    store.listPublishedReviews(),
  ]);

  const reviews = sortReviews(published);
  const stats = reviewStats(reviews);
  const galleryItems = gallery.slice(0, 6);

  // Le sommaire ne liste que les sections réellement présentes sur la page.
  const sommaire = [
    { id: "services", label: dict.pro.anchors.services },
    { id: "pourquoi-nous", label: dict.pro.anchors.why },
    ...(galleryItems.length > 0 ? [{ id: "realisations", label: dict.pro.anchors.gallery }] : []),
    ...(reviews.length > 0 ? [{ id: "avis", label: dict.pro.anchors.reviews }] : []),
    { id: "infos", label: dict.pro.anchors.infos },
    { id: "faq", label: dict.pro.anchors.faq },
  ];

  return (
    <>
      <Hero locale={locale} dict={dict} areaCount={settings.areas.length} reviews={stats} />
      <AreasBand areas={settings.areas} dict={dict} />
      <SectionNav label={dict.pro.summary} items={sommaire} />
      <ServicesPreview locale={locale} dict={dict} />
      <Trust dict={dict} />
      <HowItWorks dict={dict} />
      <EmergencyBand dict={dict} />
      <GalleryPreview items={galleryItems} locale={locale} dict={dict} />

      {reviews.length > 0 ? (
        <Section tone="mist" id="avis">
          <div className="container-page">
            <SectionHeading eyebrow={dict.nav.reviews} title={dict.reviews.title} subtitle={dict.reviews.subtitle} />
            {/* Note affichée seulement s'il existe des avis réels. */}
            {stats.count > 0 ? (
              <p className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
                <span className="font-display text-2xl font-extrabold text-ink-900">
                  {formatAverage(stats.average, locale)}
                </span>
                <Stars rating={Math.round(stats.average)} size={18} />
                <span>{countLabel(stats.count, dict.reviews.countOne, dict.reviews.countMany)}</span>
              </p>
            ) : null}
            <ReviewList reviews={reviews.slice(0, 3)} locale={locale} dict={dict} />
            <div className="mt-8 flex justify-center">
              <Link
                href={localePath(locale, "avis")}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-mist-300 bg-white px-5 text-sm font-semibold text-ink-900 shadow-card transition hover:border-slate-400"
              >
                {dict.reviews.seeAll}
                <Icon name="arrowRight" size={15} className="rtl:rotate-180" />
              </Link>
            </div>
            <ModerationNote dict={dict} />
          </div>
        </Section>
      ) : null}

      <PracticalInfo locale={locale} dict={dict} areas={settings.areas} />
      <RewardsPreview dict={dict} settings={settings} />
      <Faq dict={dict} />
      <CtaBand locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(dict.faq.items)) }}
      />
    </>
  );
}
