export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeMeta: Record<
  Locale,
  { label: string; native: string; flag: string; dir: "ltr" | "rtl"; htmlLang: string }
> = {
  fr: { label: "Français", native: "Français", flag: "🇫🇷", dir: "ltr", htmlLang: "fr-TN" },
  en: { label: "English", native: "English", flag: "🇬🇧", dir: "ltr", htmlLang: "en" },
  ar: { label: "العربية", native: "العربية", flag: "🇹🇳", dir: "rtl", htmlLang: "ar-TN" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Préfixe d'URL localisé : /fr/services, /en/services, /ar/services */
export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}
