/**
 * Remonter la page jusqu'à un élément, en dégageant l'en-tête fixe.
 *
 * `Element.scrollIntoView()` ne convient pas ici : les sections du site sont
 * en `overflow: hidden` pour contenir leurs décors, et le navigateur cherche
 * alors à faire défiler ce conteneur — qui ne défile pas. La page reste où
 * elle est, et l'élément visé se retrouve sous l'en-tête. Le calcul explicite
 * ci-dessous ne dépend d'aucun ancêtre.
 *
 * La hauteur de l'en-tête est mesurée au moment du défilement plutôt que
 * codée en dur : elle change selon que le bandeau d'annonce est affiché ou
 * fermé par le visiteur.
 */
export function remonterVers(element: HTMLElement | null, margeSupplementaire = 20): void {
  if (!element || typeof window === "undefined") return;

  const entete = document.querySelector("header");
  const marge = (entete?.getBoundingClientRect().height ?? 0) + margeSupplementaire;
  const cible = element.getBoundingClientRect().top + window.scrollY - marge;

  // Un visiteur qui a demandé moins d'animations ne veut pas d'un défilement filé.
  const animationsReduites =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({ top: Math.max(cible, 0), behavior: animationsReduites ? "auto" : "smooth" });
}
