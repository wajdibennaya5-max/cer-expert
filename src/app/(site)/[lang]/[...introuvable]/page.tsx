import { notFound } from "next/navigation";

/**
 * Attrape-tout des adresses inconnues à l'intérieur d'une langue.
 *
 * Sans cette route, `/fr/adresse-mal-tapee` ne correspond à aucun segment et
 * Next remonte jusqu'à la 404 de la racine : une page technique, sans en-tête,
 * sans pied de page, sans numéro de téléphone et sans langue déclarée. Le
 * visiteur qui se trompe d'une lettre se retrouvait dans une impasse.
 *
 * En déclarant cette route, l'adresse inconnue entre dans la mise en page du
 * site, et c'est la 404 localisée qui s'affiche — dans la bonne langue, avec le
 * bouton d'appel sous la main. Les segments statiques et dynamiques restent
 * prioritaires : aucune page réelle n'est captée ici.
 */
export default function PageIntrouvable() {
  notFound();
}
