import type { Commande, FournisseurPaiement } from "../types";

/**
 * PAIEMENT MANUEL — virement bancaire ou transfert Flouci.
 *
 * ┌─ CE QUE CE FOURNISSEUR NE FERA JAMAIS ────────────────────────────────┐
 * │ Confirmer un paiement tout seul.                                      │
 * │                                                                       │
 * │ Un virement bancaire et un transfert de portefeuille n'ont ni webhook, │
 * │ ni appel de vérification, ni référence reliant l'argent à une         │
 * │ commande. Le site n'a AUCUN moyen d'apprendre que l'argent est        │
 * │ arrivé : il devrait croire le client sur parole.                      │
 * │                                                                       │
 * │ `verifier()` rend donc toujours « en-attente », quoi qu'on lui        │
 * │ demande. Le seul chemin vers « payée » passe par un humain qui a vu   │
 * │ l'argent sur son compte, dans la console d'administration. C'est lent,│
 * │ c'est manuel, et c'est vrai.                                          │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * LES COORDONNÉES NE SONT PAS DANS LE CODE. Un RIB écrit dans un fichier
 * entre dans l'historique Git et n'en sort plus jamais, y compris si le dépôt
 * devient public un jour. Elles viennent de l'environnement du serveur, où
 * elles se changent sans redéploiement et sans laisser de trace.
 */

/** Les moyens proposés au client, tels qu'ils s'affichent. */
export interface CanalManuel {
  id: "flouci" | "virement";
  nom: string;
  aide: string;
  /** Ce que le client doit recopier, ligne par ligne. */
  lignes: Array<{ libelle: string; valeur: string; copiable?: boolean }>;
}

const propre = (v: string | undefined): string => (v ?? "").trim();

/**
 * Les coordonnées de paiement, lues dans l'environnement.
 *
 * Rien n'est inventé : un canal dont les variables manquent n'apparaît pas.
 * Afficher « RIB : non configuré » sur une page de paiement serait pire que
 * de ne pas proposer le virement du tout.
 */
export function canaux(): CanalManuel[] {
  const liste: CanalManuel[] = [];

  const telFlouci = propre(process.env.PAIEMENT_FLOUCI_TELEPHONE);
  if (telFlouci) {
    liste.push({
      id: "flouci",
      nom: "Flouci",
      aide: "Ouvrez votre application Flouci, choisissez « Envoyer », et saisissez "
        + "ce numéro. Le paiement est immédiat.",
      lignes: [
        { libelle: "Numéro Flouci", valeur: telFlouci, copiable: true },
        ...(propre(process.env.PAIEMENT_FLOUCI_NOM)
          ? [{ libelle: "Bénéficiaire", valeur: propre(process.env.PAIEMENT_FLOUCI_NOM) }]
          : []),
      ],
    });
  }

  const rib = propre(process.env.PAIEMENT_RIB);
  const iban = propre(process.env.PAIEMENT_IBAN);
  if (rib || iban) {
    liste.push({
      id: "virement",
      nom: "Virement bancaire",
      aide: "Depuis votre banque en ligne ou en agence. Comptez un à deux jours "
        + "ouvrés avant que le virement soit visible.",
      lignes: [
        ...(propre(process.env.PAIEMENT_TITULAIRE)
          ? [{ libelle: "Titulaire", valeur: propre(process.env.PAIEMENT_TITULAIRE) }]
          : []),
        ...(propre(process.env.PAIEMENT_BANQUE)
          ? [{ libelle: "Banque", valeur: propre(process.env.PAIEMENT_BANQUE) }]
          : []),
        ...(rib ? [{ libelle: "RIB", valeur: rib, copiable: true }] : []),
        ...(iban ? [{ libelle: "IBAN", valeur: iban, copiable: true }] : []),
        ...(propre(process.env.PAIEMENT_SWIFT)
          ? [{ libelle: "SWIFT", valeur: propre(process.env.PAIEMENT_SWIFT) }]
          : []),
      ],
    });
  }

  return liste;
}

/**
 * Masque des coordonnées bancaires pour un journal ou un courriel d'alerte.
 *
 * Un RIB complet recopié dans un journal d'application finit dans des
 * sauvegardes, des exports et des outils de supervision que personne n'a
 * pensé à protéger. Les quatre derniers chiffres suffisent à reconnaître un
 * compte ; ils ne suffisent pas à s'en servir.
 */
export function masquer(valeur: string): string {
  const chiffres = valeur.replace(/\s+/g, "");
  if (chiffres.length <= 4) return "•".repeat(chiffres.length);
  return `${"•".repeat(Math.max(0, chiffres.length - 4))}${chiffres.slice(-4)}`;
}

export const manuel: FournisseurPaiement = {
  id: "manuel",
  nom: "Virement ou Flouci (confirmation manuelle)",

  configure() {
    return canaux().length > 0;
  },

  manquant() {
    return canaux().length
      ? []
      : ["Aucune coordonnée de paiement configurée. Renseignez PAIEMENT_FLOUCI_TELEPHONE "
        + "et/ou PAIEMENT_RIB dans l’environnement du serveur — jamais dans le code."];
  },

  async creer(commande: Commande) {
    if (!this.configure()) {
      return { ok: false as const, raison: "Aucune coordonnée de paiement configurée." };
    }
    // Il n'y a pas de passerelle à ouvrir : le client reste sur le site, où
    // les coordonnées et sa référence s'affichent.
    return {
      ok: true as const,
      url: `/paiement/${encodeURIComponent(commande.reference)}`,
      reference: commande.reference,
    };
  },

  async lireNotification() {
    // Aucun service extérieur ne notifie ce fournisseur. Accepter une
    // notification ici reviendrait à ouvrir une porte qui n'a pas de serrure.
    return {
      ok: false as const,
      raison: "Le paiement manuel ne reçoit aucune notification automatique.",
    };
  },

  async verifier() {
    // LE CŒUR DE CE FICHIER. Toujours « en-attente », jamais « payée ».
    // Un virement ne s'auto-confirme pas, et prétendre le contraire livrerait
    // l'étude à qui clique « j'ai payé ».
    return { ok: true as const, statut: "en-attente" as const };
  },
};
