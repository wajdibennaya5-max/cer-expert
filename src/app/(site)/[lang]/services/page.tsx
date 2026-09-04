import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceCard } from "@/components/service-card";
import { ServiceSearch } from "@/components/home/service-search";
import { CtaBand } from "@/components/home/cta-band";
import { Section } from "@/components/ui/section";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { categories, servicesByCategory } from "@/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, locales, type Locale } from "@/lib/i18n/config";
import { breadcrumbJsonLd, localizedMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "services",
    title: dict.meta.services.title,
    description: dict.meta.services.description,
  });
}

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.services}
        title={dict.services.title}
        subtitle={dict.services.subtitle}
        breadcrumb={[{ label: dict.nav.services }]}
      />

      {/*
        Vingt et une prestations font un long défilement sur un téléphone. La
        recherche évite d'imposer ce parcours à qui sait déjà ce qu'il cherche,
        sans rien retirer à ceux qui préfèrent parcourir les deux métiers.
      */}
      <Section tone="light" compact>
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <ServiceSearch locale={locale} dict={dict} variante="clair" />
          </div>
        </div>
      </Section>

      {(["plomberie", "electricite"] as const).map((key, sectionIndex) => {
        const category = categories[key];
        const isPlumbing = key === "plomberie";
        return (
          <Section key={key} id={key} tone={sectionIndex % 2 === 0 ? "light" : "mist"}>
            <div className="container-page">
              <Reveal className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-white shadow-lg ${
                    isPlumbing
                      ? "bg-gradient-to-br from-aqua-400 to-aqua-700"
                      : "bg-gradient-to-br from-volt-300 to-volt-600"
                  }`}
                >
                  <Icon name={category.icon} size={32} />
                </span>
                <div>
                  <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{category.label[locale]}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    {category.short[locale]}
                  </p>
                </div>
              </Reveal>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {servicesByCategory[key].map((service, index) => (
                  <ServiceCard key={service.slug} service={service} locale={locale} dict={dict} delay={index * 45} />
                ))}
              </div>
            </div>
          </Section>
        );
      })}

      <CtaBand locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: dict.nav.home, url: `${site.url}${localePath(locale)}` },
              { name: dict.nav.services, url: `${site.url}${localePath(locale, "services")}` },
            ]),
          ),
        }}
      />
    </>
  );
}
