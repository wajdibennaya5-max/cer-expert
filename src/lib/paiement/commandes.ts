import { randomBytes, randomUUID } from "node:crypto";
import { offre, DEVISE, type ReferenceOffre } from "./offre";
import {
  transitionPermise,
  type Commande,
  type EvenementPaiement,
  type StatutPaiement,
} from "./types";

/**
 * LA VIE D'UNE COMMANDE, hors de toute base et de tout réseau.
 *
 * Ce fichier ne lit ni n'écrit rien : il transforme une commande en une autre.
 * C'est ce qui rend l'idempotence et la machine à états vérifiables sans
 * serveur, sans passerelle et sans argent réel — les trois choses qu'on ne
 * peut pas essayer deux fois en production.
 */

/**
 * Une référence lisible au téléphone.
 *
 * Sans les caractères qu'on confond en la dictant : ni O ni 0, ni I ni 1.
 * Un client qui épelle sa référence à un guichet ne doit pas avoir à préciser
 * « le zéro barré ».
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nouvelleReference(prefixe = "SOL"): string {
  const octets = randomBytes(8);
  let corps = "";
  for (const octet of octets) corps += ALPHABET[octet % ALPHABET.length];
  return `${prefixe}-${corps.slice(0, 4)}-${corps.slice(4, 8)}`;
}

export interface DemandeDeCommande {
  offre: unknown;
  client: { nom: string; telephone: string; courriel?: string };
  demandeId?: string;
  fournisseur: string;
}

/**
 * Crée une commande.
 *
 * LE MONTANT NE VIENT PAS DE L'APPELANT. Il est lu dans le catalogue des
 * offres, côté serveur, à partir de la seule référence que le navigateur a le
 * droit de choisir. Accepter un montant transmis reviendrait à laisser le
 * client fixer son prix — la faute la plus fréquente des intégrations de
 * paiement, et la plus silencieuse : le paiement est authentique, la
 * signature valide, seul le montant était faux.
 *
 * @returns la commande, ou la raison du refus — jamais d'exception : un refus
 *   doit pouvoir s'afficher au client.
 */
export function creerCommande(demande: DemandeDeCommande, maintenant = new Date()):
{ ok: true; commande: Commande } | { ok: false; raison: string } {
  const o = offre(demande?.offre);
  if (!o) return { ok: false, raison: "Cette offre n’existe pas." };

  const nom = String(demande?.client?.nom ?? "").trim();
  const telephone = String(demande?.client?.telephone ?? "").trim();
  if (!nom) return { ok: false, raison: "Le nom est nécessaire pour émettre un reçu." };
  if (!telephone) {
    return { ok: false, raison: "Le téléphone est nécessaire pour vous joindre." };
  }
  if (!demande?.fournisseur) {
    return { ok: false, raison: "Aucun moyen de paiement n’est configuré." };
  }

  const at = maintenant.toISOString();
  return {
    ok: true,
    commande: {
      id: randomUUID(),
      reference: nouvelleReference(),
      createdAt: at,
      updatedAt: at,
      demandeId: demande.demandeId,
      offre: o.reference as ReferenceOffre,
      montantMillimes: o.montantMillimes,
      devise: DEVISE,
      statut: "creee",
      client: {
        nom,
        telephone,
        ...(demande.client.courriel ? { courriel: demande.client.courriel.trim() } : {}),
      },
      fournisseur: demande.fournisseur,
      webhooksVus: [],
      livre: false,
      journal: [{ at, statut: "creee", source: "systeme", note: `Offre ${o.reference}` }],
    },
  };
}

/**
 * Fait avancer une commande.
 *
 * Deux garde-fous, et ils comptent autant l'un que l'autre.
 *
 * L'IDEMPOTENCE : les passerelles rejouent leurs notifications — c'est une
 * garantie qu'elles annoncent, pas un incident. Sans mémoire des webhooks
 * déjà vus, un rejeu enverrait le dossier une seconde fois et compterait le
 * paiement deux fois en comptabilité.
 *
 * LA MACHINE À ÉTATS : un webhook en retard, arrivé après la confirmation, ne
 * doit pas faire retomber une commande payée dans la file d'attente.
 *
 * @returns la commande, éventuellement inchangée, et ce qui s'est passé.
 */
export function appliquerStatut(
  commande: Commande,
  vers: StatutPaiement,
  {
    source = "fournisseur",
    identifiantWebhook,
    referenceFournisseur,
    note,
    maintenant = new Date(),
  }: {
    source?: EvenementPaiement["source"];
    identifiantWebhook?: string;
    referenceFournisseur?: string;
    note?: string;
    maintenant?: Date;
  } = {},
): { commande: Commande; change: boolean; raison: string } {
  if (identifiantWebhook && commande.webhooksVus.includes(identifiantWebhook)) {
    return { commande, change: false, raison: "Notification déjà traitée." };
  }

  const at = maintenant.toISOString();
  // Un webhook déjà vu s'enregistre même quand il ne change rien : c'est ce
  // qui rend le second rejeu aussi silencieux que le premier.
  const webhooksVus = identifiantWebhook
    ? [...commande.webhooksVus, identifiantWebhook].slice(-50)
    : commande.webhooksVus;

  if (commande.statut === vers) {
    return {
      commande: { ...commande, webhooksVus, updatedAt: at },
      change: false,
      raison: "La commande est déjà dans cet état.",
    };
  }

  if (!transitionPermise(commande.statut, vers)) {
    return {
      commande: {
        ...commande,
        webhooksVus,
        updatedAt: at,
        journal: [...commande.journal, {
          at,
          statut: commande.statut,
          source,
          note: `Transition refusée vers « ${vers} » : ${note ?? "hors séquence"}`,
        }],
      },
      change: false,
      raison: `Une commande « ${commande.statut} » ne peut pas passer à « ${vers} ».`,
    };
  }

  return {
    commande: {
      ...commande,
      statut: vers,
      updatedAt: at,
      webhooksVus,
      ...(referenceFournisseur ? { referenceFournisseur } : {}),
      ...(vers === "payee" && !commande.payeeLe ? { payeeLe: at } : {}),
      journal: [...commande.journal, { at, statut: vers, source, ...(note ? { note } : {}) }],
    },
    change: true,
    raison: "",
  };
}

/** Note la remise du livrable. Distincte du paiement : l'un peut échouer sans l'autre. */
export function marquerLivree(commande: Commande, maintenant = new Date()):
{ commande: Commande; change: boolean } {
  if (commande.livre) return { commande, change: false };
  if (commande.statut !== "payee") return { commande, change: false };
  const at = maintenant.toISOString();
  return {
    commande: {
      ...commande,
      livre: true,
      livreLe: at,
      updatedAt: at,
      journal: [...commande.journal, {
        at, statut: commande.statut, source: "systeme", note: "Livrable remis",
      }],
    },
    change: true,
  };
}

/**
 * CONFRONTE LA RÉPONSE DU FOURNISSEUR À CE QUI ÉTAIT DÛ.
 *
 * Un paiement authentique de un dinar sur une commande de quatre-vingt-dix est
 * un paiement authentique : la signature est bonne, la banque confirme, le
 * journal est propre. Et l'étude est offerte.
 *
 * C'est le dernier verrou de la chaîne, et il ne coûte qu'une comparaison
 * d'entiers. On ne l'applique que si le fournisseur annonce un montant : tous
 * ne le font pas, et refuser faute d'information bloquerait des paiements
 * légitimes. Quand il l'annonce, il doit correspondre exactement — un écart
 * d'un millime est un écart.
 */
export function montantConforme(
  commande: Commande,
  montantAnnonce: number | undefined,
): { conforme: true } | { conforme: false; raison: string } {
  if (montantAnnonce === undefined || montantAnnonce === null) return { conforme: true };
  if (!Number.isFinite(montantAnnonce)) {
    return { conforme: false, raison: "Montant confirmé illisible." };
  }
  if (Math.round(montantAnnonce) !== commande.montantMillimes) {
    return {
      conforme: false,
      raison: `Montant confirmé (${montantAnnonce}) différent du montant dû `
        + `(${commande.montantMillimes}).`,
    };
  }
  return { conforme: true };
}

/** Une commande donne-t-elle droit au livrable ? */
export const donneAcces = (commande: Commande | null | undefined): boolean =>
  commande?.statut === "payee";

/** Ce que le client peut voir de sa commande — jamais le journal interne. */
export function vueClient(commande: Commande) {
  return {
    reference: commande.reference,
    offre: commande.offre,
    montantMillimes: commande.montantMillimes,
    devise: commande.devise,
    statut: commande.statut,
    payeeLe: commande.payeeLe ?? null,
    livre: commande.livre,
  };
}
