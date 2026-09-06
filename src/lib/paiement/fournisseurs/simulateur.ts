import { createHmac, timingSafeEqual } from "node:crypto";
import type { Commande, FournisseurPaiement, StatutPaiement } from "../types";

/**
 * UN FOURNISSEUR DE PAIEMENT SIMULÉ — et pourquoi il n'est pas un jouet.
 *
 * On ne peut pas essayer un encaissement deux fois en production. Un rejeu de
 * webhook, un paiement refusé, une signature falsifiée, un montant modifié :
 * ce sont exactement les cas qu'il faut avoir éprouvés AVANT le premier client,
 * et qu'aucune passerelle réelle ne laisse déclencher à volonté.
 *
 * Ce fournisseur les reproduit tous, avec la même mécanique que les vraies
 * passerelles : une page de paiement, un retour navigateur, une notification
 * signée en HMAC-SHA256. Le cœur du système ne sait pas qu'il est simulé.
 *
 * IL NE PREND JAMAIS D'ARGENT, et il refuse de se lancer en production.
 * Une passerelle d'essai active sur un site public livrerait des études
 * payantes à qui saurait cliquer « payer » — sans jamais rien encaisser.
 */

/** Le secret de signature. En simulation, un repli permet de travailler sans configuration. */
function secret(): string {
  return process.env.PAIEMENT_SIMULATEUR_SECRET
    ?? "simulation-uniquement-definir-PAIEMENT_SIMULATEUR_SECRET";
}

/** Signe une notification comme le ferait une passerelle. */
export function signerNotification(corps: string): string {
  return createHmac("sha256", secret()).update(corps).digest("hex");
}

function signatureValide(corps: string, fournie: string | null): boolean {
  if (!fournie) return false;
  const attendue = signerNotification(corps);
  const a = Buffer.from(fournie);
  const b = Buffer.from(attendue);
  // Longueurs différentes : `timingSafeEqual` lèverait au lieu de répondre.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const STATUTS: Record<string, StatutPaiement> = {
  paye: "payee",
  echec: "echouee",
  abandon: "abandonnee",
};

export const simulateur: FournisseurPaiement = {
  id: "simulateur",
  nom: "Simulateur (essais uniquement)",

  configure() {
    // EN PRODUCTION, IL N'EXISTE PAS. C'est la seule protection qui compte :
    // un oubli de variable d'environnement ne doit pas laisser une caisse
    // ouverte sur un site public.
    return process.env.NODE_ENV !== "production";
  },

  manquant() {
    return process.env.NODE_ENV === "production"
      ? ["Le simulateur est désactivé en production : configurez une vraie passerelle."]
      : [];
  },

  async creer(commande: Commande, { retourUrl, webhookUrl }) {
    if (!this.configure()) {
      return { ok: false as const, raison: "Le simulateur est désactivé en production." };
    }
    // La « page de paiement » est servie par l'application elle-même : aucun
    // appel réseau, donc aucune dépendance à un service extérieur pour
    // éprouver le parcours complet.
    const parametres = new URLSearchParams({
      reference: commande.reference,
      montant: String(commande.montantMillimes),
      retour: retourUrl,
      webhook: webhookUrl,
    });
    return {
      ok: true as const,
      url: `/paiement/simulateur?${parametres.toString()}`,
      reference: `SIM-${commande.reference}`,
    };
  },

  async lireNotification(corps: unknown, entetes: Headers) {
    const brut = typeof corps === "string" ? corps : JSON.stringify(corps ?? {});
    if (!signatureValide(brut, entetes.get("x-signature"))) {
      // On ne dit pas au demandeur CE QUI cloche dans sa signature : ce serait
      // lui apprendre à la forger.
      return { ok: false as const, raison: "Signature invalide." };
    }
    let charge: Record<string, unknown>;
    try {
      charge = typeof corps === "string" ? JSON.parse(corps) : (corps as Record<string, unknown>);
    } catch {
      return { ok: false as const, raison: "Notification illisible." };
    }
    const reference = String(charge?.reference ?? "");
    const statut = STATUTS[String(charge?.evenement ?? "")];
    const identifiant = String(charge?.id ?? "");
    if (!reference || !statut || !identifiant) {
      return { ok: false as const, raison: "Notification incomplète." };
    }
    return { ok: true as const, reference, statut, identifiant };
  },
};
