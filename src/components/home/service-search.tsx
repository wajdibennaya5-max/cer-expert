"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { categories, services } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Comparaison indifférente aux accents et à la casse.
 *
 * Un client tape « electricite » ou « ELECTRICITE » aussi souvent que
 * « électricité » — surtout depuis un clavier de téléphone, où les accents
 * demandent un appui long. Sans cette normalisation, la recherche resterait
 * muette sur la moitié des saisies.
 */
function normaliser(valeur: string): string {
  return valeur.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const MAX_RESULTATS = 5;

/**
 * Recherche instantanée dans les prestations.
 *
 * Le visiteur d'un site d'artisan n'arrive pas en se demandant quelle
 * prestation commander : il arrive avec un problème, et le mot qu'il a en tête
 * est « fuite », « disjoncte » ou « bouché ». Cette recherche fait le lien
 * entre son vocabulaire et le catalogue, sans aucun aller-retour serveur — les
 * vingt et une prestations tiennent en mémoire.
 *
 * Quand rien ne correspond, on ne laisse pas le visiteur devant un vide : on
 * l'emmène décrire son problème, ce que l'entreprise saura traiter de toute
 * façon.
 */
export function ServiceSearch({
  locale,
  dict,
  variante = "sombre",
}: {
  locale: Locale;
  dict: Dictionary;
  /** « sombre » pour le héros, « clair » pour les pages intérieures. */
  variante?: "sombre" | "clair";
}) {
  const sombre = variante === "sombre";
  const [requete, setRequete] = useState("");
  const idListe = useId();

  const resultats = useMemo(() => {
    const terme = normaliser(requete);
    if (terme.length < 2) return [];
    return services
      .filter((service) => {
        // Le nom du métier compte autant que celui de la prestation : beaucoup
        // de visiteurs tapent « plomberie » ou « électricité » avant de penser
        // à « débouchage » ou « tableau ».
        const champs = [
          service.name[locale],
          service.short[locale],
          categories[service.category].label[locale],
          ...service.keywords,
        ].map(normaliser);
        return champs.some((champ) => champ.includes(terme));
      })
      .slice(0, MAX_RESULTATS);
  }, [requete, locale]);

  const chercheSansTrouver = normaliser(requete).length >= 2 && resultats.length === 0;

  return (
    <div className="mt-8">
      <label
        htmlFor={idListe}
        className={`mb-2 block text-sm font-semibold ${sombre ? "text-white" : "text-ink-900"}`}
      >
        {dict.search.label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
          <Icon name="search" size={19} />
        </span>
        <input
          id={idListe}
          type="search"
          value={requete}
          onChange={(event) => setRequete(event.target.value)}
          placeholder={dict.search.placeholder}
          autoComplete="off"
          // `min-w-0` : sans lui, un champ de saisie refuse de descendre sous sa
          // largeur intrinsèque dans une grille, et déborde sur les petits écrans.
          className={`w-full min-w-0 rounded-2xl border py-4 pe-4 ps-12 text-base shadow-lg transition placeholder:text-slate-400 focus:border-aqua-400 focus:outline-none focus:ring-4 ${
            sombre
              ? "border-white/15 bg-white/8 text-white backdrop-blur-sm focus:bg-white/12 focus:ring-aqua-500/25"
              : "border-mist-200 bg-white text-ink-900 focus:ring-aqua-100"
          }`}
        />
      </div>

      {/* Le nombre de résultats est annoncé aux lecteurs d'écran, qui ne voient
          pas la liste apparaître sous le champ. */}
      <p className="sr-only" aria-live="polite">
        {resultats.length > 0
          ? `${resultats.length} — ${dict.search.resultsLabel}`
          : chercheSansTrouver
            ? dict.search.none
            : ""}
      </p>

      {resultats.length > 0 ? (
        <ul
          className={`mt-3 overflow-hidden rounded-2xl border shadow-2xl ${
            sombre ? "border-white/12 bg-ink-900/85 backdrop-blur-xl" : "border-mist-200 bg-white"
          }`}
        >
          {resultats.map((service) => (
            <li
              key={service.slug}
              className={`border-b last:border-b-0 ${sombre ? "border-white/6" : "border-mist-100"}`}
            >
              <Link
                href={localePath(locale, `services/${service.slug}`)}
                className={`flex items-center gap-3 px-4 py-3.5 transition ${sombre ? "hover:bg-white/6" : "hover:bg-mist-50"}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    categories[service.category].accent === "aqua"
                      ? "bg-aqua-500/15 text-aqua-300"
                      : "bg-volt-400/15 text-volt-300"
                  }`}
                >
                  <Icon name={service.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${sombre ? "text-white" : "text-ink-900"}`}>
                    {service.name[locale]}
                  </span>
                  <span className={`block truncate text-xs ${sombre ? "text-slate-400" : "text-slate-500"}`}>
                    {categories[service.category].label[locale]}
                  </span>
                </span>
                <Icon name="chevronRight" size={15} className="shrink-0 text-slate-500 rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {chercheSansTrouver ? (
        <div
          className={`mt-3 rounded-2xl border p-4 ${
            sombre ? "border-white/12 bg-ink-900/85 backdrop-blur-xl" : "border-mist-200 bg-white"
          }`}
        >
          <p className={`text-sm ${sombre ? "text-slate-300" : "text-slate-600"}`}>{dict.search.none}</p>
          <Link
            href={localePath(locale, "demande")}
            className={`mt-3 inline-flex items-center gap-2 text-sm font-bold transition ${
              sombre ? "text-aqua-300 hover:text-aqua-200" : "text-aqua-700 hover:text-aqua-800"
            }`}
          >
            {dict.search.describe}
            <Icon name="chevronRight" size={15} className="rtl:rotate-180" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
