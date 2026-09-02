import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { RequestForm } from "@/components/forms/request-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { store } from "@/lib/store";
import { localizedMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "demande",
    title: dict.meta.request.title,
    description: dict.meta.request.description,
  });
}

export default async function RequestPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const settings = await store.getSettings();

  const steps = [dict.how.steps.one, dict.how.steps.two, dict.how.steps.three, dict.how.steps.four];

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.request}
        title={dict.request.title}
        subtitle={dict.request.subtitle}
        breadcrumb={[{ label: dict.nav.request }]}
      >
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua-400/15 text-sm font-bold text-aqua-300">
                {index + 1}
              </span>
              <span className="text-xs font-semibold text-slate-200">{step.title}</span>
            </li>
          ))}
        </ol>
      </PageHeader>

      <Section tone="mist">
        <div className="container-page">
          <Suspense
            fallback={
              <p className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
                <Icon name="refresh" size={16} />
                {dict.common.loading}
              </p>
            }
          >
            <RequestForm locale={locale} dict={dict} areas={settings.areas} />
          </Suspense>
        </div>
      </Section>
    </>
  );
}
