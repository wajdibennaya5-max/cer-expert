import { localeMeta, type Locale } from "@/lib/i18n/config";
import type { Review } from "@/lib/store/types";

/**
 * Chiffres d'avis — calculés sur les avis RÉELS uniquement.
 *
 * Les avis d'exemple (`isSample`) peuvent s'afficher, clairement marqués, pour
 * montrer à quoi ressemblera la page. Ils ne doivent jamais entrer dans une
 * moyenne ni dans un total : une note calculée sur des textes de
 * démonstration serait une fausse note présentée comme vraie. Tout chiffre
 * public sur les avis passe par ici, et nulle part ailleurs.
 */
export interface ReviewStats {
  /** Nombre d'avis réels publiés. */
  count: number;
  /** Moyenne arrondie au dixième ; 0 s'il n'y a aucun avis réel. */
  average: number;
  /** Nombre d'avis réels par note, de 5 à 1. */
  distribution: { rating: number; count: number }[];
}

export function reviewStats(reviews: Review[]): ReviewStats {
  const real = reviews.filter((review) => !review.isSample);
  const count = real.length;
  const total = real.reduce((sum, review) => sum + review.rating, 0);
  return {
    count,
    average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: real.filter((review) => Math.round(review.rating) === rating).length,
    })),
  };
}

/** Les vrais avis d'abord, du plus récent au plus ancien ; les exemples ensuite. */
export function sortReviews(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    if (a.isSample !== b.isSample) return a.isSample ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * Date d'un avis, au mois près.
 *
 * Calculée côté serveur et transmise toute faite aux composants client : deux
 * moteurs de formatage (Node et le navigateur) ne rendent pas toujours la même
 * chaîne, et la moindre différence casserait l'hydratation.
 */
export function reviewDateLabel(review: Review, locale: Locale): string {
  const date = new Date(review.createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { month: "long", year: "numeric" }).format(date);
}

/** Remplace `{n}` dans un libellé pluriel. */
export function countLabel(count: number, one: string, many: string): string {
  return count === 1 ? one : many.replace("{n}", String(count));
}

/** Moyenne à la française (4,8) ou à l'anglaise (4.8) selon la langue. */
export function formatAverage(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeMeta[locale].htmlLang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
