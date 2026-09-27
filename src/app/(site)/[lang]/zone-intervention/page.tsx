import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { button } from "@/components/ui/button";
import { PhoneText } from "@/components/ui/phone-text";
import { GrandTunisMap } from "@/components/zone/grand-tunis-map";
import { categories, servicesByCategory } from "@/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, locales, type Locale } from "@/lib/i18n/config";
import { breadcrumbJsonLd, localizedMetadata } from "@/lib/seo";
import { site, telHref, whatsappHref } from "@/lib/site";
import { store } from "@/lib/store";
import { gouvernoratsCouverts } from "@/lib/zones";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** Les zones se modifient depuis l'administration : la page suit, chaque minute. */
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "zone-intervention",
    title: dict.meta.zone.title,
    description: dict.meta.zone.description,
  });
}

export default async function ZonePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const { areas } = await store.getSettings();
  const covered = gouvernoratsCouverts(areas);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.zone.eyebrow}
        title={dict.zone.title}
        subtitle={dict.zone.subtitle}
        breadcrumb={[{ label: dict.nav.zone }]}
      >
        {areas.length > 0 ? (
          <ul className="mt-7 flex flex-wrap gap-2">
            {areas.map((area) => (
              <li
                key={area}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/90"
              >
                <Icon name="pin" size={13} className="text-aqua-300" />
                {area}
              </li>
            ))}
          </ul>
        ) : null}
      </PageHeader>

      <Section tone="mist">
        <div className="container-page grid gap-8 lg:grid-cols-12 lg:items-start">
          <Reveal className="lg:col-span-7">
            <figure className="rounded-3xl border border-mist-200 bg-white p-4 shadow-card sm:p-6">
              <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2 px-1">
                <span className="text-base font-bold text-ink-900">{dict.zone.mapTitle}</span>
                <span className="text-xs text-slate-500">{dict.zone.mapNote}</span>
              </figcaption>
              <GrandTunisMap covered={covered} labels={dict.zone.governorates} title={dict.zone.mapTitle} />
            </figure>
          </Reveal>

          <div className="lg:col-span-5">
            <h2 className="text-xl font-extrabold text-ink-900">{dict.zone.listTitle}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {areas.map((area, index) => (
                <Reveal key={area} delay={index * 50} as="li">
                  <div className="flex items-center gap-4 rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-400 to-aqua-600 text-white">
                      <Icon name="pin" size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink-900">{area}</span>
                      <span className="block text-xs text-slate-500">{dict.zone.cardText}</span>
                    </span>
                    <Link
                      href={localePath(locale, `demande?zone=${encodeURIComponent(area)}`)}
                      aria-label={`${dict.zone.cardCta} — ${area}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition hover:bg-ink-800"
                    >
                      <Icon name="arrowRight" size={17} className="rtl:rotate-180" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="container-page">
          <SectionHeading title={dict.zone.servicesTitle} subtitle={dict.zone.servicesText} />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {(["plomberie", "electricite"] as const).map((key, index) => {
              const category = categories[key];
              const isPlumbing = key === "plomberie";
              return (
                <Reveal key={key} delay={index * 80} className="h-full">
                  <div className="h-full rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-7">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                          isPlumbing
                            ? "bg-gradient-to-br from-aqua-400 to-aqua-700"
                            : "bg-gradient-to-br from-volt-300 to-volt-600"
                        }`}
                      >
                        <Icon name={category.icon} size={24} />
                      </span>
                      <h3 className="text-lg font-extrabold text-ink-900">{category.label[locale]}</h3>
                    </div>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {servicesByCategory[key].map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={localePath(locale, `services/${service.slug}`)}
                            className="inline-flex rounded-full border border-mist-200 bg-mist-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink-900"
                          >
                            {service.name[locale]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      <Section tone="mist" compact>
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-ink-950 p-7 text-white shadow-card sm:p-10">
              <div className="aurora opacity-50" aria-hidden="true" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-md">
                  <h2 className="text-2xl font-extrabold">{dict.zone.notListedTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{dict.zone.notListedText}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:shrink-0 xl:flex-nowrap">
                  <a href={telHref} className={button("volt", "lg", "w-full whitespace-nowrap sm:w-auto")}>
                    <Icon name="phone" size={18} />
                    <PhoneText />
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={button("outline", "lg", "w-full whitespace-nowrap sm:w-auto")}
                  >
                    <Icon name="whatsapp" size={18} />
                    {dict.cta.whatsapp}
                  </a>
                  <Link
                    href={localePath(locale, "demande")}
                    className={button("primary", "lg", "w-full whitespace-nowrap sm:w-auto")}
                  >
                    <Icon name="spark" size={18} />
                    {dict.cta.request}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: dict.nav.home, url: `${site.url}${localePath(locale)}` },
              { name: dict.nav.zone, url: `${site.url}${localePath(locale, "zone-intervention")}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "Service",
              name: dict.zone.title,
              serviceType: "Plomberie et électricité à domicile",
              provider: { "@id": `${site.url}/#business` },
              areaServed: areas.map((area) => ({ "@type": "City", name: area })),
              url: `${site.url}${localePath(locale, "zone-intervention")}`,
            },
          ]),
        }}
      />
    </>
  );
}
