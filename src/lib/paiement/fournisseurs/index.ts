import type { FournisseurPaiement } from "../types";
import { simulateur } from "./simulateur";
import { flouci } from "./flouci";
import { manuel } from "./manuel";

/**
 * LE REGISTRE DES MOYENS DE PAIEMENT.
 *
 * Un seul endroit sait quelles passerelles existent, et une variable
 * d'environnement décide de celle qui encaisse. Le reste de l'application ne
 * connaît que l'interface : ajouter Paymee, Konnect ou Flouci demain se fera
 * en déposant un fichier ici, sans toucher aux routes, à la console
 * d'administration ni au site.
 *
 * RIEN N'EST ACTIF PAR DÉFAUT EN PRODUCTION. Comme le relais solaire et le
 * fond de carte : tant que la passerelle n'est pas déclarée, l'application dit
 * qu'aucun paiement en ligne n'est disponible plutôt que de faire semblant.
 */
const REGISTRE: Record<string, FournisseurPaiement> = {
  [flouci.id]: flouci,
  [manuel.id]: manuel,
  [simulateur.id]: simulateur,
};

/** Tous les fournisseurs connus, configurés ou non. */
export const fournisseursConnus = (): FournisseurPaiement[] => Object.values(REGISTRE);

/** Un fournisseur par son identifiant, ou `null`. */
export const fournisseurParId = (id: string | null | undefined): FournisseurPaiement | null =>
  (id ? REGISTRE[id] ?? null : null);

/**
 * Le fournisseur qui encaisse, ou `null`.
 *
 * `PAIEMENT_FOURNISSEUR` nomme la passerelle. Sans lui, l'application retombe
 * sur le simulateur EN DÉVELOPPEMENT SEULEMENT — jamais en production, où
 * l'absence de configuration signifie qu'il n'y a pas de paiement en ligne,
 * pas qu'on en invente un.
 */
export function fournisseurActif(): FournisseurPaiement | null {
  const demande = process.env.PAIEMENT_FOURNISSEUR?.trim();
  if (demande) {
    const f = REGISTRE[demande];
    return f && f.configure() ? f : null;
  }
  if (process.env.NODE_ENV === "production") return null;
  return simulateur.configure() ? simulateur : null;
}

/** Le paiement en ligne est-il possible ? */
export const paiementDisponible = (): boolean => fournisseurActif() !== null;

/**
 * Ce qui manque pour encaisser, en clair.
 * Sert à la console d'administration : une caisse fermée doit dire pourquoi.
 */
export function diagnostic(): { actif: string | null; raisons: string[] } {
  const demande = process.env.PAIEMENT_FOURNISSEUR?.trim();
  const actif = fournisseurActif();
  if (actif) return { actif: actif.id, raisons: [] };

  if (!demande) {
    return {
      actif: null,
      raisons: process.env.NODE_ENV === "production"
        ? ["Aucune passerelle déclarée : définissez PAIEMENT_FOURNISSEUR."]
        : ["Le simulateur est indisponible."],
    };
  }
  const f = REGISTRE[demande];
  if (!f) {
    return {
      actif: null,
      raisons: [`« ${demande} » n’est pas une passerelle connue. Disponibles : `
        + `${Object.keys(REGISTRE).join(", ")}.`],
    };
  }
  return { actif: null, raisons: f.manquant() };
}

export { simulateur, flouci, manuel };
