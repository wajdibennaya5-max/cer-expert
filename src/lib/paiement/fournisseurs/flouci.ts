import type { Commande, FournisseurPaiement, StatutPaiement } from "../types";

/**
 * FLOUCI — passerelle de paiement tunisienne.
 *
 * ┌─ CE QUI EST ÉTABLI ───────────────────────────────────────────────────┐
 * │ • Les montants s'expriment en MILLIMES, entiers. Le projet compte     │
 * │   déjà ainsi partout : aucune conversion, donc aucune erreur d'unité. │
 * │ • Les identifiants sont un jeton public (`app_token`) et une clé      │
 * │   privée (`app_secret`), obtenus dans l'espace développeur Flouci.    │
 * │ • La création de paiement rend une adresse vers laquelle envoyer le   │
 * │   client, et un identifiant de transaction.                           │
 * │ • Le parcours revient sur `success_link` ou `fail_link`, et une       │
 * │   notification peut être poussée sur une adresse `webhook`.           │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ CE QUI RESTE À CONFIRMER SUR VOTRE COMPTE ───────────────────────────┐
 * │ La documentation de Flouci n'est pas joignable depuis l'environnement │
 * │ où ce fichier a été écrit. Les NOMS DE CHAMPS ci-dessous sont ceux    │
 * │ des intégrations publiques existantes, pas une lecture de la          │
 * │ documentation officielle. Ils sont donc tous regroupés dans `CHAMPS`  │
 * │ et lus par des fonctions tolérantes : si Flouci nomme une clé         │
 * │ autrement, la correction tient en une ligne.                          │
 * │                                                                       │
 * │ `npm run paiement:flouci` interroge votre compte avec vos vraies      │
 * │ clés et imprime les réponses BRUTES. C'est la façon honnête de fermer │
 * │ cet écart : lire ce que le service répond, pas ce qu'on croit.        │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ LA DÉCISION D'ARCHITECTURE QUI REND CET ÉCART SANS DANGER ───────────┐
 * │ Le webhook n'accorde JAMAIS un paiement. Il dit seulement quelle      │
 * │ commande regarder ; c'est `verifier()` — un appel serveur à serveur   │
 * │ authentifié par la clé privée — qui tranche.                          │
 * │                                                                       │
 * │ Deux raisons. D'abord, une notification non signée est une requête    │
 * │ HTTP que n'importe qui peut envoyer : la croire, c'est offrir         │
 * │ l'étude à qui devine l'adresse. Ensuite, je ne sais pas avec          │
 * │ certitude si Flouci signe les siennes — et une sécurité qu'on n'a pas │
 * │ vérifiée n'en est pas une.                                            │
 * └───────────────────────────────────────────────────────────────────────┘
 */

const BASE = process.env.FLOUCI_BASE_URL?.trim() || "https://developers.flouci.com/api";

/** Les noms de champs, tous ici. Une correction éventuelle tient en une ligne. */
export const CHAMPS = {
  creation: "/v2/generate_payment",
  verification: "/verify_payment",
  /** Clés lues dans la réponse de création, par ordre de préférence. */
  urlPaiement: ["link", "payment_url", "url", "result.link", "result.payment_url"],
  identifiant: ["payment_id", "paymentId", "id",
    "result.payment_id", "result.paymentId", "result.id"],
  /** Clés lues dans la réponse de vérification. */
  statut: ["status", "state", "result.status", "result.state"],
  montant: ["amount", "result.amount"],
} as const;

/** Ce que Flouci répond, ramené au vocabulaire du projet. */
const STATUTS: Record<string, StatutPaiement> = {
  SUCCESS: "payee",
  SUCCEEDED: "payee",
  PAID: "payee",
  COMPLETED: "payee",
  FAILURE: "echouee",
  FAILED: "echouee",
  DECLINED: "echouee",
  ERROR: "echouee",
  CANCELLED: "abandonnee",
  CANCELED: "abandonnee",
  EXPIRED: "abandonnee",
  PENDING: "en-attente",
  PROCESSING: "en-attente",
  IN_PROGRESS: "en-attente",
};

/** Lit une clé éventuellement imbriquée, sans lever. */
function lire(objet: unknown, chemin: string): unknown {
  return chemin.split(".").reduce<unknown>(
    (courant, cle) =>
      (courant && typeof courant === "object"
        ? (courant as Record<string, unknown>)[cle]
        : undefined),
    objet,
  );
}

/** La première clé présente parmi plusieurs orthographes possibles. */
function premier(objet: unknown, chemins: readonly string[]): unknown {
  for (const chemin of chemins) {
    const valeur = lire(objet, chemin);
    if (valeur !== undefined && valeur !== null && valeur !== "") return valeur;
  }
  return undefined;
}

/** Un entier, ou rien. `Number(null)` vaut zéro, et zéro n'est pas « absent ». */
function entier(valeur: unknown): number | null {
  if (valeur === null || valeur === undefined || valeur === "" || typeof valeur === "boolean") {
    return null;
  }
  const n = Number(valeur);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Le délai au-delà duquel on cesse d'attendre la banque. */
const DELAI_MS = 15_000;

/**
 * Un appel à Flouci, qui ne lève jamais et n'attend pas indéfiniment.
 *
 * Sans délai maximal, une passerelle qui ne répond pas bloque une route
 * Next.js jusqu'au bout du temps d'exécution : le client voit une page qui
 * tourne, et rien dans le journal ne dit pourquoi.
 */
async function appeler(
  chemin: string,
  init: RequestInit,
  requete: typeof fetch = fetch,
): Promise<{ ok: true; corps: unknown } | { ok: false; raison: string }> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const reponse = await requete(`${BASE}${chemin}`, { ...init, signal: controleur.signal });
    const texte = await reponse.text();
    let corps: unknown = null;
    try {
      corps = texte ? JSON.parse(texte) : null;
    } catch {
      return { ok: false, raison: `Réponse illisible de la passerelle (HTTP ${reponse.status}).` };
    }
    if (!reponse.ok) {
      // Le corps d'erreur de la banque n'est jamais relayé au client : il peut
      // contenir des identifiants de compte ou des détails d'infrastructure.
      return { ok: false, raison: `La passerelle a refusé la demande (HTTP ${reponse.status}).` };
    }
    return { ok: true, corps };
  } catch (erreur) {
    const abandon = erreur instanceof Error && erreur.name === "AbortError";
    return {
      ok: false,
      raison: abandon
        ? "La passerelle n’a pas répondu à temps."
        : "La passerelle est injoignable.",
    };
  } finally {
    clearTimeout(minuteur);
  }
}

function identifiants(): { token: string; secret: string; suivi: string } | null {
  const token = process.env.FLOUCI_APP_TOKEN?.trim();
  const secret = process.env.FLOUCI_APP_SECRET?.trim();
  if (!token || !secret) return null;
  return { token, secret, suivi: process.env.FLOUCI_TRACKING_ID?.trim() || "solarys" };
}

/**
 * Construit le fournisseur.
 *
 * `requete` est injectable pour que les essais éprouvent le comportement face
 * à une passerelle lente, muette, incohérente ou malveillante — des cas qu'on
 * ne peut pas provoquer sur un service réel.
 */
export function creerFlouci(requete: typeof fetch = fetch): FournisseurPaiement {
  return {
    id: "flouci",
    nom: "Flouci",

    configure() {
      return identifiants() !== null;
    },

    manquant() {
      const absents: string[] = [];
      if (!process.env.FLOUCI_APP_TOKEN?.trim()) absents.push("FLOUCI_APP_TOKEN");
      if (!process.env.FLOUCI_APP_SECRET?.trim()) absents.push("FLOUCI_APP_SECRET");
      return absents.length
        ? [`Variables absentes : ${absents.join(", ")}. Elles se trouvent dans votre `
          + "espace développeur Flouci."]
        : [];
    },

    async creer(commande: Commande, { retourUrl, webhookUrl }) {
      const cles = identifiants();
      if (!cles) return { ok: false as const, raison: "Flouci n’est pas configuré." };

      const reponse = await appeler(CHAMPS.creation, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Les deux formes coexistent selon la version de l'API. Les envoyer
          // toutes les deux évite un aller-retour de configuration, et aucune
          // des deux n'est un secret pour l'autre.
          apppublic: cles.token,
          appsecret: cles.secret,
          authorization: `Bearer ${cles.token}:${cles.secret}`,
        },
        body: JSON.stringify({
          app_token: cles.token,
          app_secret: cles.secret,
          // Le montant vient de la COMMANDE, calculée côté serveur, jamais
          // d'une valeur transmise par le navigateur.
          amount: String(commande.montantMillimes),
          accept_card: "true",
          session_timeout_secs: 1200,
          success_link: `${retourUrl}?issue=succes`,
          fail_link: `${retourUrl}?issue=echec`,
          webhook: webhookUrl,
          developer_tracking_id: cles.suivi,
          // Notre référence voyage avec la transaction : c'est elle qui
          // permettra de retrouver la commande au retour.
          client_id: commande.reference,
        }),
      }, requete);

      if (!reponse.ok) return { ok: false as const, raison: reponse.raison };

      const url = premier(reponse.corps, CHAMPS.urlPaiement);
      const reference = premier(reponse.corps, CHAMPS.identifiant);
      if (typeof url !== "string" || !url.startsWith("https://")) {
        // Une réponse inattendue n'est pas un demi-succès : sans adresse de
        // paiement valide, envoyer le client quelque part serait pire que rien.
        return {
          ok: false as const,
          raison: "La passerelle n’a pas rendu d’adresse de paiement exploitable.",
        };
      }
      return {
        ok: true as const,
        url,
        ...(reference ? { reference: String(reference) } : {}),
      };
    },

    async lireNotification(corps: unknown) {
      // Rappel : cette notification n'accorde rien. Elle sert à savoir quelle
      // commande vérifier. `verifier()` tranche ensuite.
      const reference = premier(corps, ["client_id", "developer_tracking_id", "reference",
        "result.client_id"]);
      const identifiant = premier(corps, CHAMPS.identifiant);
      if (!reference) {
        return { ok: false as const, raison: "Notification sans référence de commande." };
      }
      return {
        ok: true as const,
        reference: String(reference),
        // Délibérément « en-attente » : le seul effet d'un webhook est de
        // déclencher la vérification, jamais d'accorder le paiement.
        statut: "en-attente" as StatutPaiement,
        identifiant: identifiant ? String(identifiant) : `hook-${String(reference)}-${Date.now()}`,
      };
    },

    async verifier(commande: Commande) {
      const cles = identifiants();
      if (!cles) return { ok: false as const, raison: "Flouci n’est pas configuré." };
      if (!commande.referenceFournisseur) {
        return { ok: false as const, raison: "Aucune transaction n’a été ouverte." };
      }

      const reponse = await appeler(
        `${CHAMPS.verification}/${encodeURIComponent(commande.referenceFournisseur)}`,
        {
          method: "GET",
          headers: {
            apppublic: cles.token,
            appsecret: cles.secret,
            authorization: `Bearer ${cles.token}:${cles.secret}`,
          },
        },
        requete,
      );
      if (!reponse.ok) return { ok: false as const, raison: reponse.raison };

      const brut = premier(reponse.corps, CHAMPS.statut);
      const statut = STATUTS[String(brut ?? "").toUpperCase()];
      if (!statut) {
        // Un statut qu'on ne comprend pas n'est PAS un paiement. Le traiter
        // comme un succès par défaut serait la porte ouverte la plus large
        // qu'on puisse laisser.
        return {
          ok: false as const,
          raison: `État inconnu rendu par la passerelle : « ${String(brut ?? "vide")} ».`,
        };
      }
      const montant = entier(premier(reponse.corps, CHAMPS.montant));
      return {
        ok: true as const,
        statut,
        ...(montant !== null ? { montantMillimes: montant } : {}),
        identifiant: commande.referenceFournisseur,
      };
    },
  };
}

export const flouci = creerFlouci();
