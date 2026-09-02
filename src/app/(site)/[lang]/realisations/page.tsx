import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
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
    title: dict.meta.gallery.title,
    description: dict.meta.gallery.description,
    alternates: {
      canonical: `${site.url}/${lang}/realisations`,
      languages: Object.fromEntries(locales.map((item) => [item, `${site.url}/${item}/realisations`])),
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const items = await store.listPublishedGallery();

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.gallery}
        title={dict.gallery.title}
        subtitle={dict.gallery.subtitle}
        breadcrumb={[{ label: dict.nav.gallery }]}
      />
      <Section tone="mist">
        <div className="container-page">
          <GalleryGrid items={items} dict={dict} />
        </div>
      </Section>
      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
