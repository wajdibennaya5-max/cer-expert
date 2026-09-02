import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LegalContent } from "@/components/site/legal-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "conditions",
    title: dict.meta.terms.title,
    description: dict.meta.terms.description,
  });
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        title={dict.legal.terms.title}
        breadcrumb={[{ label: dict.footer.terms }]}
      />
      <LegalContent sections={dict.legal.terms.sections} updatedLabel={dict.legal.terms.updated} />
    </>
  );
}
