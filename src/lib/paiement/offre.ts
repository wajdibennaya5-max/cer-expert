/**
 * L'OFFRE PAYANTE, DÉCIDÉE ICI ET NULLE PART AILLEURS.
 *
 * LA RÈGLE QUI COMPTE : le montant ne vient JAMAIS du navigateur.
 *
 * C'est la faute la plus fréquente et la plus coûteuse d'une intégration de
 * paiement. Le site envoie « montant : 90 », le serveur le transmet à la
 * banque, et le premier visiteur curieux ouvre les outils de développement,
 * remplace 90 par 1, et repart avec l'étude pour un dinar. Rien dans le
 * journal ne signale l'anomalie : le paiement est authentique, la signature
 * est valide, seul le montant était faux.
 *
 * Alors le montant est ici, en dur, côté serveur. Le navigateur ne peut ni le
 * choisir ni le suggérer : il demande une référence d'offre, et le serveur
 * décide de ce que cela coûte.
 */

/** La devise. Le dinar tunisien se compte en millimes : trois décimales. */
export const DEVISE = "TND" as const;

/** Les millimes d'un dinar. Tous les calculs se font en entier. */
export const MILLIMES_PAR_DINAR = 1000;

/**
 * Les offres vendues. Les montants sont en MILLIMES, entiers.
 *
 * Compter en dinars décimaux mènerait tôt ou tard à `0.1 + 0.2 = 0.30000000000000004`
 * dans un rapprochement bancaire. Les passerelles tunisiennes attendent
 * d'ailleurs des millimes.
 */
export const OFFRES = {
  "etude-detaillee": {
    reference: "etude-detaillee",
    nom: "Étude photovoltaïque détaillée",
    montantMillimes: 90_000,
    description:
      "Dimensionnement détaillé, calepinage à vos dimensions, production mois par mois, "
      + "étude économique sur 25 ans, dossier PDF opposable à vos devis.",
    /** Ce que le client reçoit une fois le paiement confirmé. */
    livrable: "rapport-pdf",
  },
} as const;

export type ReferenceOffre = keyof typeof OFFRES;
export type Offre = (typeof OFFRES)[ReferenceOffre];

/** Une référence d'offre connue, ou `null` — jamais une offre inventée. */
export function offre(reference: unknown): Offre | null {
  if (typeof reference !== "string") return null;
  return (OFFRES as Record<string, Offre>)[reference] ?? null;
}

/** Un montant en millimes, écrit comme on le lit : « 90,000 DT ». */
export function formaterMillimes(millimes: number): string {
  if (!Number.isFinite(millimes)) return "—";
  const dinars = Math.trunc(millimes / MILLIMES_PAR_DINAR);
  const reste = Math.abs(millimes % MILLIMES_PAR_DINAR);
  return `${dinars},${String(reste).padStart(3, "0")} DT`;
}
