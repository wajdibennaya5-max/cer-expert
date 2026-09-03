/**
 * Configuration centrale de l'entreprise.
 * Toute information de contact se modifie ICI (ou via les variables
 * d'environnement correspondantes) et se propage à l'ensemble du site :
 * en-tête, pied de page, boutons d'appel, données structurées SEO, e-mails.
 */

const rawPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+21654062596";

/** Normalise un numéro pour les liens `tel:` / `wa.me` (chiffres et « + » uniquement). */
function toDialable(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/** Format lisible : +216 54 062 596 */
function toDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("216") && digits.length === 11) {
    const local = digits.slice(3);
    return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return value;
}

export const site = {
  name: "WAJDI & TAYSSIR SERVICES PRO",
  shortName: "W&T Services Pro",
  legalName: "Wajdi & Tayssir Services Pro",
  tagline: "Plomberie • Électricité • Dépannage à domicile",
  phone: {
    display: toDisplay(rawPhone),
    dial: toDialable(rawPhone),
    /** Format international sans « + », requis par les liens WhatsApp. */
    whatsapp: toDialable(rawPhone).replace("+", ""),
  },
  /**
   * Adresse professionnelle sur le domaine de l'entreprise.
   *
   * Elle est servie gratuitement par Cloudflare Email Routing, qui redirige
   * tout le courrier du domaine vers la boîte personnelle. Une adresse au nom
   * du domaine inspire nettement plus confiance sur un devis qu'une adresse
   * gratuite, et c'est la seule qui permette de prouver le domaine auprès de
   * services tiers.
   */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@20122011.xyz",
  /** Pays d'exercice — aucune adresse physique n'est inventée ici. */
  country: "TN",
  countryName: "Tunisie",
  /** Zones d'intervention : modifiables depuis la console d'administration. */
  defaultAreas: ["Tunis", "Ariana", "Ben Arous", "La Manouba", "Grand Tunis"],
  hours: {
    weekdays: "08:00 – 19:00",
    saturday: "08:00 – 17:00",
    emergency: "Urgences : nous consulter",
  },
  /** URL canonique publique — indispensable au SEO (sitemap, Open Graph, hreflang). */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://20122011.xyz").replace(/\/$/, ""),
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
  },
} as const;

export const telHref = `tel:${site.phone.dial}`;
export const mailHref = `mailto:${site.email}`;
export const whatsappHref = `https://wa.me/${site.phone.whatsapp}`;
