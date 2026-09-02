import Link from "next/link";
import { Icon } from "@/components/icons";
import { ServiceCard } from "@/components/service-card";
import { Section, SectionHeading } from "@/components/ui/section";
import { button } from "@/components/ui/button";
import { categories, featuredSlugs, getService, servicesByCategory } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function ServicesPreview({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = featuredSlugs.map((slug) => getService(slug)).filter((service) => service !== undefined);

  return (
    <Section id="services">
      <div className="container-page">
        <SectionHeading eyebrow={dict.nav.services} title={dict.services.title} subtitle={dict.services.subtitle} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {(["plomberie", "electricite"] as const).map((key) => {
            const category = categories[key];
            const isPlumbing = key === "plomberie";
            return (
              <Link
                key={key}
                href={localePath(locale, `services#${key}`)}
                className={`lift group relative overflow-hidden rounded-3xl p-7 text-white shadow-card transition hover:shadow-card-hover ${
                  isPlumbing
                    ? "bg-gradient-to-br from-aqua-600 via-aqua-700 to-ink-900"
                    : "bg-gradient-to-br from-volt-500 via-volt-600 to-ink-900"
                }`}
              >
                <span className="absolute -end-6 -top-6 opacity-15 transition-transform duration-700 group-hover:scale-110">
                  <Icon name={category.icon} size={140} />
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Icon name={category.icon} size={24} />
                </span>
                <h3 className="relative mt-5 font-display text-2xl font-extrabold">{category.label[locale]}</h3>
                <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-white/85">
                  {category.short[locale]}
                </p>
                <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold">
                  {servicesByCategory[key].length} {dict.services.allServices.toLowerCase()}
                  <Icon
                    name="arrowRight"
                    size={16}
                    className="transition-transform group-hover:translate-x-1 rtl:rotate-180"
                  />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service, index) => (
            <ServiceCard key={service.slug} service={service} locale={locale} dict={dict} delay={index * 60} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href={localePath(locale, "services")} className={button("light", "lg", "border border-mist-200")}>
            {dict.cta.seeAll}
            <Icon name="arrowRight" size={17} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
