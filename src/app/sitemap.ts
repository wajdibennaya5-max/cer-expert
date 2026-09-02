import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { locales } from "@/lib/i18n/config";
import { site } from "@/lib/site";

/** Pages publiques, dans les trois langues, avec leurs équivalents linguistiques. */
const staticPaths = ["", "services", "demande", "realisations", "avis", "contact", "confidentialite", "conditions"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  function alternates(path: string) {
    return {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `${site.url}/${locale}${path ? `/${path}` : ""}`]),
      ),
    };
  }

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${site.url}/${locale}${path ? `/${path}` : ""}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "demande" || path === "services" ? 0.9 : 0.6,
        alternates: alternates(path),
      });
    }
    for (const service of services) {
      entries.push({
        url: `${site.url}/${locale}/services/${service.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(`services/${service.slug}`),
      });
    }
  }

  return entries;
}
