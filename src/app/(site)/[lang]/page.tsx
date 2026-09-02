import { notFound } from "next/navigation";
import { Hero } from "@/components/home/hero";
import { AreasBand } from "@/components/home/areas-band";
import { ServicesPreview } from "@/components/home/services-preview";
import { Trust } from "@/components/home/trust";
import { HowItWorks } from "@/components/home/how-it-works";
import { EmergencyBand } from "@/components/home/emergency-band";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { RewardsPreview } from "@/components/home/rewards";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/home/cta-band";
import { ReviewList, ModerationNote } from "@/components/reviews/review-list";
import { Section, SectionHeading } from "@/components/ui/section";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { faqJsonLd } from "@/lib/seo";
import { store } from "@/lib/store";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const [settings, gallery, reviews] = await Promise.all([
    store.getSettings(),
    store.listPublishedGallery(),
    store.listPublishedReviews(),
  ]);

  return (
    <>
      <Hero locale={locale} dict={dict} areaCount={settings.areas.length} />
      <AreasBand areas={settings.areas} dict={dict} />
      <ServicesPreview locale={locale} dict={dict} />
      <Trust dict={dict} />
      <HowItWorks dict={dict} />
      <EmergencyBand dict={dict} />
      <GalleryPreview items={gallery.slice(0, 6)} locale={locale} dict={dict} />

      {reviews.length > 0 ? (
        <Section tone="mist">
          <div className="container-page">
            <SectionHeading eyebrow={dict.nav.reviews} title={dict.reviews.title} subtitle={dict.reviews.subtitle} />
            <ReviewList reviews={reviews.slice(0, 3)} locale={locale} dict={dict} />
            <ModerationNote dict={dict} />
          </div>
        </Section>
      ) : null}

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
