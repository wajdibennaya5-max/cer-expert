import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // La console d'administration, les routes techniques et l'espace client
        // n'ont aucune raison d'être explorés.
        disallow: ["/admin", "/api/", "/fr/espace-client", "/en/espace-client", "/ar/espace-client"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
