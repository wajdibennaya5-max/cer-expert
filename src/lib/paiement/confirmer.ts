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

/**
 * LA CONFIRMATION PAR UN HUMAIN — le seul chemin pour un paiement manuel.
 *
 * Un virement et un transfert de portefeuille ne se vérifient pas par API :
 * quelqu'un regarde son compte, voit l'argent, et le dit. Cette fonction
 * matérialise ce geste, et le journalise avec le nom de qui l'a posé — parce
 * qu'une commande passée à « payée » sans trace serait indiscernable d'une
 * fraude interne.
 *
 * ELLE N'EST PAS APPELABLE DEPUIS LE SITE. Sa seule porte d'entrée est une
 * route protégée par `requireAdmin()` : le contrôle d'accès vit côté serveur,
 * pas dans l'interface.
 *
 * `montantRecu` est facultatif. Renseigné, il est confronté au montant dû —
 * un virement de 9 DT sur une commande de 90 se remarque au moment où on le
 * saisit, pas trois mois plus tard dans un rapprochement.
 */
export function confirmerParAdmin(
  commande: Commande,
  { par, reference, montantRecu, maintenant = new Date() }: {
    par: string;
    reference?: string;
    montantRecu?: number;
    maintenant?: Date;
  },
): { commande: Commande; change: boolean; raison: string } {
  const qui = String(par ?? "").trim();
  if (!qui) {
    return { commande, change: false, raison: "La confirmation doit être signée." };
  }

  const controle = montantConforme(commande, montantRecu);
  if (!controle.conforme) {
    return { commande, change: false, raison: controle.raison };
  }

  const details = [
    `Confirmé à la main par ${qui}`,
    reference ? `référence bancaire ${reference}` : null,
    montantRecu !== undefined ? `montant reçu ${montantRecu} millimes` : null,
  ].filter(Boolean).join(" — ");

  return appliquerStatut(commande, "payee", {
    source: "admin",
    ...(reference ? { referenceFournisseur: reference } : {}),
    note: details,
    maintenant,
  });
}
