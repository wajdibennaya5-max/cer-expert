import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LegalContent } from "@/components/site/legal-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return {
    title: dict.meta.privacy.title,
    description: dict.meta.privacy.description,
    alternates: { canonical: `${site.url}/${lang}/confidentialite` },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        title={dict.legal.privacy.title}
        breadcrumb={[{ label: dict.footer.privacy }]}
      />
      <LegalContent sections={dict.legal.privacy.sections} updatedLabel={dict.legal.privacy.updated} />
    </>
  );
}
