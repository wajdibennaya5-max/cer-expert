import { appliquerStatut, montantConforme } from "./commandes";
import { fournisseurParId } from "./fournisseurs";
import type { Commande } from "./types";

/**
 * LE SEUL CHEMIN VERS « PAYÉE ».
 *
 * Trois portes à franchir, dans cet ordre, et aucune n'est facultative :
 *
 *   1. le fournisseur confirme, serveur à serveur, avec la clé privée ;
 *   2. le montant confirmé correspond exactement à ce qui était dû ;
 *   3. la transition est permise par la machine à états.
 *
 * Ni le retour du navigateur ni le webhook n'entrent ici comme preuve : ils
 * ne font que DÉCLENCHER cette vérification. Un client qui bricole son URL de
 * retour, ou un tiers qui devine l'adresse du webhook, arrivent tous les deux
 * à cette fonction — et repartent avec la réponse de la banque, pas la leur.
 */
export async function confirmer(
  commande: Commande,
  { identifiantWebhook, source = "fournisseur", maintenant = new Date() }: {
    identifiantWebhook?: string;
    source?: "fournisseur" | "retour-client" | "admin";
    maintenant?: Date;
  } = {},
): Promise<{ commande: Commande; change: boolean; raison: string }> {
  const fournisseur = fournisseurParId(commande.fournisseur);
  if (!fournisseur) {
    return { commande, change: false, raison: "La passerelle de cette commande n’existe plus." };
  }

  const reponse = await fournisseur.verifier(commande);
  if (!reponse.ok) return { commande, change: false, raison: reponse.raison };

  if (reponse.statut === "payee") {
    const controle = montantConforme(commande, reponse.montantMillimes);
    if (!controle.conforme) {
      // Le paiement est réel, mais il n'est pas celui qu'on attendait. On ne
      // livre pas, et on laisse une trace bien visible : c'est une anomalie
      // qui demande un humain, pas un échec ordinaire.
      return appliquerStatut(commande, "echouee", {
        source,
        identifiantWebhook,
        note: `ANOMALIE DE MONTANT — ${controle.raison}`,
        maintenant,
      });
    }
  }

  return appliquerStatut(commande, reponse.statut, {
    source,
    identifiantWebhook,
    referenceFournisseur: reponse.identifiant ?? commande.referenceFournisseur,
    maintenant,
  });
}
