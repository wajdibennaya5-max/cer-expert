import { services } from "@/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, localeMeta, type Locale } from "@/lib/i18n/config";
import { site } from "@/lib/site";

/**
 * Données structurées (schema.org).
 *
 * Elles décrivent une entreprise de services qui se déplace chez ses clients :
 * on déclare donc une zone desservie (`areaServed`) et aucune adresse postale,
 * puisque aucune adresse n'a été fournie. Rien n'est inventé — un faux
 * `PostalAddress` serait sanctionné par les moteurs et trompeur pour le client.
 *
 * ⚠️ Ne pas ajouter `aggregateRating` ni `review` ici.
 *
 * Les avis affichés sur ce site portent sur l'entreprise et sont hébergés par
 * l'entreprise : Google les qualifie d'« avis intéressés » (self-serving) et
 * rend explicitement la page inéligible aux étoiles dans les résultats de
 * recherche. Le balisage serait donc sans effet visible — et, sur un domaine
 * qui a déjà connu une suspension pour contenu trompeur, il ajouterait un
 * signal indésirable pour un gain nul.
 *
 * Les étoiles ne viennent que d'une source tierce (fiche Google
 * Business Profile), jamais d'ici.
 */

export function organizationJsonLd(locale: Locale, areas: string[]) {
  const dict = getDictionary(locale);
  const sameAs = [site.social.facebook, site.social.instagram].filter(Boolean);
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
    // Le point de contact explicite renseigne les langues réellement parlées :
    // c'est ce qui décide qu'un client arabophone ou anglophone ose appeler.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: site.phone.dial,
      email: site.email,
      availableLanguage: ["French", "Arabic", "English"],
      areaServed: site.country,
    },
    // `sameAs` n'est déclaré que si les comptes existent vraiment : une page
    // sociale annoncée puis introuvable dégrade la confiance du moteur.
    ...(sameAs.length > 0 ? { sameAs } : {}),
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

/**
 * Métadonnées communes à une page publique localisée.
 *
 * Regroupe ce qui doit être identique partout : l'URL de base (indispensable
 * pour résoudre la vignette de partage), l'adresse canonique et les trois
 * versions linguistiques. Chaque page n'a plus qu'à fournir son titre et sa
 * description.
 */
export function localizedMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
}) {
  const clean = path.replace(/^\/+/, "");
  const urlFor = (item: Locale) => `${site.url}/${item}${clean ? `/${clean}` : ""}`;
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    alternates: {
      canonical: urlFor(locale),
      languages: Object.fromEntries(locales.map((item) => [localeMeta[item].htmlLang, urlFor(item)])),
    },
    openGraph: {
      title,
      description,
      url: urlFor(locale),
      images: [{ url: "/image-partage", width: 1200, height: 630, alt: site.name }],
    },
  };
}
