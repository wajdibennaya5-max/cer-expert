import { services } from "@/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localeMeta, type Locale } from "@/lib/i18n/config";
import { site } from "@/lib/site";

/**
 * Données structurées (schema.org).
 *
 * Elles décrivent une entreprise de services qui se déplace chez ses clients :
 * on déclare donc une zone desservie (`areaServed`) et aucune adresse postale,
 * puisque aucune adresse n'a été fournie. Rien n'est inventé — un faux
 * `PostalAddress` serait sanctionné par les moteurs et trompeur pour le client.
 */

export function organizationJsonLd(locale: Locale, areas: string[]) {
  const dict = getDictionary(locale);
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Plumber", "Electrician"],
    "@id": `${site.url}/#business`,
    name: site.name,
    alternateName: site.shortName,
    description: dict.meta.home.description,
    url: `${site.url}/${locale}`,
    telephone: site.phone.dial,
    email: site.email,
    image: `${site.url}/icon.svg`,
    logo: `${site.url}/icon.svg`,
    priceRange: "$$",
    areaServed: areas.map((area) => ({ "@type": "City", name: area })),
    address: { "@type": "PostalAddress", addressCountry: site.country },
    availableLanguage: ["fr", "ar", "en"],
    knowsLanguage: ["fr", "ar", "en"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "19:00",
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "08:00", closes: "17:00" },
    ],
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.name[locale], description: service.short[locale] },
    })),
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: `${site.url}/${locale}`,
    name: site.name,
    inLanguage: localeMeta[locale].htmlLang,
    publisher: { "@id": `${site.url}/#business` },
  };
}

export function serviceJsonLd(locale: Locale, slug: string) {
  const service = services.find((item) => item.slug === slug);
  if (!service) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name[locale],
    description: service.detail[locale],
    serviceType: service.name.fr,
    provider: { "@id": `${site.url}/#business` },
    areaServed: { "@type": "Country", name: site.countryName },
    url: `${site.url}/${locale}/services/${service.slug}`,
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(entries: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  };
}
