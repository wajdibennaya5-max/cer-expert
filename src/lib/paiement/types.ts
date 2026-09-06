import type { ReferenceOffre } from "./offre";

/**
 * LE CYCLE DE VIE D'UN PAIEMENT.
 *
 * Six états, et un seul chemin vers « payee » : la confirmation du
 * fournisseur, reçue sur le webhook et vérifiée par signature. Le retour du
 * navigateur ne fait JAMAIS passer une commande en « payee » — il n'est
 * qu'un affichage, et il est trivialement falsifiable par qui sait modifier
 * une URL.
 *
 * « echouee » et « abandonnee » sont distinctes : la première est un refus de
 * la banque, la seconde un client qui a fermé l'onglet. On ne relance pas les
 * deux de la même façon.
 */
export const statutsPaiement = [
  "creee",
  "en-attente",
  "payee",
  "echouee",
  "abandonnee",
  "remboursee",
] as const;
export type StatutPaiement = (typeof statutsPaiement)[number];

/** Les transitions permises. Toute autre est refusée et journalisée. */
export const TRANSITIONS: Record<StatutPaiement, readonly StatutPaiement[]> = {
  creee: ["en-attente", "payee", "echouee", "abandonnee"],
  "en-attente": ["payee", "echouee", "abandonnee"],
  // UNE COMMANDE PAYÉE NE REDEVIENT PAS EN ATTENTE. Un webhook en retard,
  // rejoué par le fournisseur après la confirmation, ferait autrement
  // retomber une commande réglée dans la file d'attente.
  payee: ["remboursee"],
  echouee: ["en-attente", "payee"],
  abandonnee: ["en-attente", "payee"],
  remboursee: [],
} as const;

export function transitionPermise(de: StatutPaiement, vers: StatutPaiement): boolean {
  return TRANSITIONS[de]?.includes(vers) ?? false;
}

/** Un évènement du parcours, conservé tel quel — c'est la piste d'audit. */
export interface EvenementPaiement {
  at: string;
  statut: StatutPaiement;
  source: "systeme" | "fournisseur" | "admin" | "retour-client";
  note?: string;
}

/**
 * Une commande.
 *
 * `montantMillimes` est recopié depuis l'offre au moment de la création, et
 * non relu de l'offre plus tard : si le prix change demain, une commande
 * d'hier reste due au prix d'hier. C'est ce que le client a accepté.
 */
export interface Commande {
  id: string;
  /** Référence lisible communiquée au client et à la banque, ex. SOL-4F2A-91C7. */
  reference: string;
  createdAt: string;
  updatedAt: string;
  /** La demande d'étude à laquelle ce paiement se rattache, si elle existe. */
  demandeId?: string;
  offre: ReferenceOffre;
  montantMillimes: number;
  devise: "TND";
  statut: StatutPaiement;
  client: {
    nom: string;
    telephone: string;
    courriel?: string;
  };
  fournisseur: string;
  /** L'identifiant de la transaction chez le fournisseur, quand il l'a donné. */
  referenceFournisseur?: string;
  /** L'adresse vers laquelle le client a été envoyé pour payer. */
  urlPaiement?: string;
  /** Horodatage de la confirmation reçue sur le webhook. */
  payeeLe?: string;
  /**
   * Les identifiants de webhook déjà traités.
   *
   * Les passerelles rejouent leurs notifications — c'est même une garantie
   * qu'elles annoncent. Sans cette liste, un rejeu enverrait le dossier une
   * seconde fois et fausserait la comptabilité.
   */
  webhooksVus: string[];
  /** Le livrable a-t-il été remis ? Distinct du paiement : l'un peut échouer sans l'autre. */
  livre: boolean;
  livreLe?: string;
  journal: EvenementPaiement[];
}

/**
 * Ce qu'un fournisseur de paiement doit savoir faire.
 *
 * Trois opérations, pas une de plus. Tout le reste — les états, l'idempotence,
 * la livraison — appartient au cœur et ne se réécrit pas pour chaque banque.
 */
export interface FournisseurPaiement {
  /** Identifiant technique, celui qu'on met dans la variable d'environnement. */
  id: string;
  nom: string;
  /** Le fournisseur est-il configuré ? Sans clé, il ne prétend pas fonctionner. */
  configure(): boolean;
  /** Ce qui manque pour qu'il fonctionne, en clair. */
  manquant(): string[];
  /**
   * Ouvre une transaction chez le fournisseur.
   * @returns l'adresse où envoyer le client, et la référence côté fournisseur
   */
  creer(commande: Commande, options: { retourUrl: string; webhookUrl: string }):
    Promise<{ ok: true; url: string; reference?: string }
      | { ok: false; raison: string }>;
  /**
   * Lit une notification reçue sur le webhook, APRÈS en avoir vérifié la
   * signature. Un fournisseur qui ne sait pas signer ses notifications
   * renvoie `ok: false` : on n'accorde pas un paiement sur la foi d'une
   * requête HTTP que n'importe qui peut envoyer.
   */
  lireNotification(corps: unknown, entetes: Headers):
    Promise<{ ok: true; reference: string; statut: StatutPaiement; identifiant: string }
      | { ok: false; raison: string }>;
}
