import { site } from "@/lib/site";

/**
 * Affichage du numéro de téléphone.
 *
 * `<bdi>` isole le numéro de la direction du texte environnant : sans lui, en
 * arabe (RTL), « +216 54 062 596 » s'affiche à l'envers — un numéro faux, donc
 * un client perdu. C'est exactement le cas d'usage de cet élément HTML.
 */
export function PhoneText({ className, value }: { className?: string; value?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {value ?? site.phone.display}
    </bdi>
  );
}
