import { defaultLocale, isLocale, type Locale } from "./config";
import { fr, type Dictionary } from "./dictionaries/fr";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

const dictionaries: Record<Locale, Dictionary> = { fr, en, ar };

/**
 * Les dictionnaires sont importés statiquement : ils font partie du bundle
 * rendu côté serveur et n'entraînent aucun aller-retour réseau.
 */
export function getDictionary(locale: string): Dictionary {
  return dictionaries[isLocale(locale) ? locale : defaultLocale];
}

export type { Dictionary };
