import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ServiceCard } from "@/components/service-card";
import { CtaBand } from "@/components/home/cta-band";
import { AssistantTrigger } from "@/components/assistant/assistant-button";
import { button } from "@/components/ui/button";
import { categories, getService, services } from "@/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, locales, type Locale } from "@/lib/i18n/config";
import { breadcrumbJsonLd, localizedMetadata, serviceJsonLd } from "@/lib/seo";
import { site, telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

/** Les 21 prestations × 3 langues sont générées à la construction du site. */
export function generateStaticParams() {
  return locales.flatMap((lang) => services.map((service) => ({ lang, slug: service.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "404" };
  const locale = isLocale(lang) ? lang : "fr";
  return localizedMetadata({
    locale,
    path: `services/${slug}`,
    title: service.name[locale],
    description: service.short[locale],
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const service = getService(slug);
  if (!service) notFound();

  const dict = getDictionary(locale);
  const category = categories[service.category];
  const related = services
    .filter((item) => item.category === service.category && item.slug !== service.slug)
    .slice(0, 3);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={category.label[locale]}
        title={service.name[locale]}
        subtitle={service.short[locale]}
        breadcrumb={[
          { label: dict.nav.services, href: localePath(locale, "services") },
          { label: service.name[locale] },
        ]}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={localePath(locale, `demande?service=${service.slug}`)}
            className={button("primary", "lg", "w-full sm:w-auto")}
          >
            <Icon name="spark" size={18} />
            {dict.cta.requestThis}
          </Link>
          <a href={telHref} className={button("volt", "lg", "w-full sm:w-auto")}>
            <Icon name="phone" size={18} />
            <PhoneText />
          </a>
          <AssistantTrigger className={button("outline", "lg", "w-full sm:w-auto")}>
            <Icon name="send" size={17} />
            {dict.cta.assistantShort}
          </AssistantTrigger>
        </div>
      </PageHeader>

      <Section>
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="text-2xl font-extrabold text-ink-900">{dict.services.detailIntro}</h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">{service.detail[locale]}</p>

            {service.emergency ? (
              <p className="mt-6 flex items-start gap-3 rounded-2xl border border-volt-300 bg-volt-50 p-5 text-sm leading-relaxed text-volt-800">
                <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
                <span>{dict.emergency.safety}</span>
              </p>
            ) : null}
          </Reveal>

          <Reveal delay={100} className="lg:col-span-5">
            <div className="rounded-3xl border border-mist-200 bg-mist-50 p-7 shadow-card">
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink-900">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                    service.category === "plomberie" ? "bg-aqua-500" : "bg-volt-500"
                  }`}
                >
                  <Icon name={service.icon} size={19} />
                </span>
                {dict.services.includes}
              </h2>
              <ul className="mt-5 space-y-3">
                {service.includes[locale].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Icon name="check" size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath(locale, `demande?service=${service.slug}`)}
                className={button("primary", "lg", "mt-7 w-full")}
              >
                {dict.cta.requestThis}
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="mist">
          <div className="container-page">
            <SectionHeading align="start" title={dict.services.relatedTitle} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <ServiceCard key={item.slug} service={item} locale={locale} dict={dict} delay={index * 60} />
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={localePath(locale, "services")}
                className="inline-flex items-center gap-2 text-sm font-bold text-aqua-700 transition hover:text-aqua-800"
              >
                <Icon name="arrowRight" size={16} className="rotate-180 rtl:rotate-0" />
                {dict.services.backToServices}
              </Link>
            </div>
          </div>
        </Section>
      ) : null}

      <CtaBand locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd(locale, service.slug)) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: dict.nav.home, url: `${site.url}${localePath(locale)}` },
              { name: dict.nav.services, url: `${site.url}${localePath(locale, "services")}` },
              { name: service.name[locale], url: `${site.url}${localePath(locale, `services/${service.slug}`)}` },
            ]),
          ),
        }}
      />
    </>
  );
}
