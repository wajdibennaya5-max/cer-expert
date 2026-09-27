/**
 * Correspondance entre les zones saisies dans l'administration et les quatre
 * gouvernorats du Grand Tunis.
 *
 * Les zones sont du texte libre : « L'Ariana », « Ariana » et « ariana »
 * désignent le même gouvernorat. On compare donc des formes normalisées, et
 * jamais par inclusion — « Grand Tunis » contient « tunis » sans désigner le
 * seul gouvernorat de Tunis.
 */

export const gouvernorats = ["ariana", "tunis", "manouba", "benArous"] as const;
export type Gouvernorat = (typeof gouvernorats)[number];

const noms: Record<Gouvernorat, string[]> = {
  tunis: ["tunis"],
  ariana: ["ariana"],
  benArous: ["ben arous"],
  manouba: ["manouba"],
};

function normaliser(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/^(la |l')/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Gouvernorats couverts d'après la liste des zones.
 * « Grand Tunis » désigne, par définition, les quatre.
 */
export function gouvernoratsCouverts(zones: string[]): Set<Gouvernorat> {
  const formes = zones.map(normaliser);
  if (formes.includes("grand tunis")) return new Set(gouvernorats);
  return new Set(gouvernorats.filter((cle) => noms[cle].some((nom) => formes.includes(nom))));
}
