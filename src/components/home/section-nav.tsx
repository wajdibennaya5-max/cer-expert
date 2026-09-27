"use client";

import { useEffect, useState } from "react";

/**
 * Sommaire de la page d'accueil.
 *
 * Une fiche d'artisan se parcourt comme un profil : services, réalisations,
 * avis, infos pratiques. Le sommaire permet d'y sauter directement, et indique
 * en permanence où l'on se trouve.
 *
 * Collant sur grand écran seulement. Sur téléphone, l'en-tête et la barre
 * d'action occupent déjà le haut et le bas de l'écran : une troisième bande
 * fixe mangerait la page. Il y reste une rangée défilante, à sa place.
 */
export function SectionNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const [offset, setOffset] = useState(72);

  // Hauteur réelle de l'en-tête : elle varie avec le bandeau d'annonce et la
  // barre d'informations, qui se replie au défilement.
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const mesurer = () => setOffset(Math.round(header.getBoundingClientRect().height));
    mesurer();
    const observer = new ResizeObserver(mesurer);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries.filter((entry) => entry.isIntersecting);
        if (visibles.length === 0) return;
        const premiere = visibles.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (premiere) setActive(premiere.target.id);
      },
      // Une section est « courante » quand elle occupe le tiers haut de l'écran.
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label={label}
      className="z-30 border-b border-mist-200 bg-white/90 backdrop-blur-xl lg:sticky"
      style={{ top: offset }}
    >
      <div className="container-page">
        <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 py-2.5 sm:mx-0 sm:px-0 lg:justify-center">
          {items.map((item) => {
            const courant = active === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={courant ? "true" : undefined}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition ${
                    courant ? "bg-ink-900 text-white" : "text-slate-600 hover:bg-mist-100 hover:text-ink-900"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
