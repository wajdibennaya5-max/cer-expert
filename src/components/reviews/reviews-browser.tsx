"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { ReviewCard } from "./review-card";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Review } from "@/lib/store/types";

const PAR_PAGE = 6;

/**
 * Liste d'avis paginée par « Voir plus ».
 *
 * Tout est déjà dans la page (rendu serveur, lisible sans JavaScript et par
 * les moteurs) : le bouton ne fait que dévoiler la suite, sans requête.
 * Le focus passe au premier avis nouvellement affiché, pour qu'un utilisateur
 * au clavier ou au lecteur d'écran reprenne sa lecture au bon endroit.
 */
export function ReviewsBrowser({
  reviews,
  dateLabels,
  locale,
  dict,
}: {
  reviews: Review[];
  dateLabels: Record<string, string>;
  locale: Locale;
  dict: Dictionary;
}) {
  const [visible, setVisible] = useState(PAR_PAGE);

  if (reviews.length === 0) return null;

  function showMore() {
    const next = visible;
    setVisible((count) => count + PAR_PAGE);
    requestAnimationFrame(() => {
      document.getElementById(`avis-${reviews[next]?.id}`)?.focus();
    });
  }

  return (
    <div>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, index) => (
          <li
            key={review.id}
            id={`avis-${review.id}`}
            tabIndex={-1}
            hidden={index >= visible}
            className="h-full rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-aqua-300"
          >
            <ReviewCard review={review} locale={locale} dict={dict} dateLabel={dateLabels[review.id]} />
          </li>
        ))}
      </ul>

      {visible < reviews.length ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={showMore}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-mist-300 bg-white px-6 text-sm font-semibold text-ink-900 shadow-card transition hover:border-slate-400"
          >
            {dict.reviews.showMore}
            <span className="text-slate-500">({reviews.length - visible})</span>
            <Icon name="chevronDown" size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
