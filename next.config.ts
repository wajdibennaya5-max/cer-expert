import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * La CSP reste volontairement stricte : aucun script tiers n'est utilisé par le site.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/**
 * Pages publiques — la survie du site quand le serveur d'origine s'arrête.
 *
 * Le site est hébergé sur un téléphone : il s'éteint, il se décharge, Android
 * finit par arrêter le processus. Ces directives permettent au réseau de
 * Cloudflare de continuer à servir les pages pendant ce temps :
 *
 *   max-age=0                → le navigateur revalide toujours ; le visiteur
 *                              ne voit jamais une page périmée par sa faute.
 *   s-maxage=60              → Cloudflare garde la page fraîche une minute,
 *                              soit exactement la revalidation d'ISR du site.
 *   stale-while-revalidate   → passé ce délai, la page en cache est servie
 *                              immédiatement pendant qu'elle se rafraîchit.
 *   stale-if-error           → et surtout : si l'origine ne répond plus, la
 *                              dernière version connue est servie une semaine
 *                              durant, au lieu d'une erreur 502.
 *
 * Ces en-têtes ne suffisent pas seuls : Cloudflare ne met pas le HTML en cache
 * par défaut. Il faut créer une règle de cache et activer « Always Online ».
 * La marche à suivre est dans MISE-EN-LIGNE-TERMUX.md.
 */
const publicCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=0, s-maxage=60, stale-while-revalidate=86400, stale-if-error=604800",
  },
];

/**
 * Espace client, administration et API : jamais de cache, nulle part.
 *
 * Ces pages contiennent des données personnelles — demandes d'intervention,
 * numéros de téléphone, photos de clients. Une mise en cache à la périphérie
 * les servirait au visiteur suivant. Le `no-store` explicite l'interdit même
 * si une règle « tout mettre en cache » est activée par mégarde côté
 * Cloudflare : c'est le filet de sécurité qui rend l'erreur impossible.
 */
const noStore = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];

/** Les trois langues du site, pour cibler les pages publiques. */
const LANG = "fr|en|ar";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },

      // Pages publiques. Le motif exclut explicitement « espace-client » :
      // deux règles qui se recouvrent produiraient deux en-têtes Cache-Control
      // dans la même réponse, et le comportement dépendrait alors du cache.
      { source: `/:lang(${LANG})`, headers: publicCache },
      { source: `/:lang(${LANG})/:path((?!espace-client).*)`, headers: publicCache },

      // Tout ce qui est personnel ou authentifié.
      { source: `/:lang(${LANG})/espace-client`, headers: noStore },
      { source: `/:lang(${LANG})/espace-client/:path+`, headers: noStore },
      { source: "/admin", headers: noStore },
      { source: "/admin/:path+", headers: noStore },
      { source: "/api/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
