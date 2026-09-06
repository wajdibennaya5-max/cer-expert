import test from "node:test";
import assert from "node:assert/strict";
import { offre, OFFRES, formaterMillimes, MILLIMES_PAR_DINAR } from "@/lib/paiement/offre";
import {
  creerCommande, appliquerStatut, marquerLivree, donneAcces, vueClient, nouvelleReference,
} from "@/lib/paiement/commandes";
import { transitionPermise, statutsPaiement } from "@/lib/paiement/types";
import { simulateur, signerNotification } from "@/lib/paiement/fournisseurs/simulateur";
import { fournisseurActif, diagnostic, fournisseurParId } from "@/lib/paiement/fournisseurs";

const CLIENT = { nom: "Ali Ben Salah", telephone: "20123456" };

/**
 * Bascule `NODE_ENV`.
 *
 * `process.env` refuse `Object.defineProperty` : il n'accepte que des
 * descripteurs de données ordinaires. L'affectation directe suffit — et c'est
 * bien ce que fait un hébergeur.
 */
function enProduction(oui: boolean): void {
  // TypeScript déclare `NODE_ENV` en lecture seule pour décourager les
  // bascules sauvages dans le code applicatif — la règle est bonne. Ici c'est
  // précisément ce qu'on éprouve : le comportement du code SUR UN SERVEUR DE
  // PRODUCTION, où c'est l'hébergeur qui pose la variable.
  const env = process.env as Record<string, string>;
  env.NODE_ENV = oui ? "production" : "test";
}
const commande = () => {
  const r = creerCommande({ offre: "etude-detaillee", client: CLIENT, fournisseur: "simulateur" });
  if (!r.ok) throw new Error(r.raison);
  return r.commande;
};

test("LE MONTANT NE VIENT JAMAIS DU NAVIGATEUR", () => {
  // La faute la plus fréquente et la plus silencieuse d'une intégration de
  // paiement : le client remplace 90 par 1 dans la requête, le paiement est
  // authentique, la signature valide, et seul le montant était faux.
  const r = creerCommande({
    offre: "etude-detaillee",
    client: CLIENT,
    fournisseur: "simulateur",
    // Tout ce qu'un navigateur malveillant pourrait glisser :
    ...({ montantMillimes: 1, montant: 1, prix: 0, devise: "EUR" } as object),
  });
  assert.ok(r.ok);
  assert.equal(r.commande.montantMillimes, OFFRES["etude-detaillee"].montantMillimes);
  assert.equal(r.commande.montantMillimes, 90_000);
  assert.equal(r.commande.devise, "TND");
});

test("une offre inconnue ne crée pas de commande à zéro dinar", () => {
  for (const mauvaise of [undefined, null, "", "gratuite", 0, { reference: "etude-detaillee" }]) {
    const r = creerCommande({ offre: mauvaise, client: CLIENT, fournisseur: "simulateur" });
    assert.equal(r.ok, false, `${JSON.stringify(mauvaise)} accepté à tort`);
  }
  assert.equal(offre("etude-detaillee")?.montantMillimes, 90_000);
  assert.equal(offre("autre"), null);
});

test("une commande sans nom ni téléphone est refusée, avec sa raison", () => {
  for (const client of [{ nom: "", telephone: "20123456" }, { nom: "Ali", telephone: "  " }]) {
    const r = creerCommande({ offre: "etude-detaillee", client, fournisseur: "simulateur" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.raison.length > 15, "un refus sans explication ne sert à rien");
  }
  const sansCaisse = creerCommande({ offre: "etude-detaillee", client: CLIENT, fournisseur: "" });
  assert.equal(sansCaisse.ok, false);
});

test("les montants se comptent en millimes, jamais en dinars décimaux", () => {
  // `0.1 + 0.2` vaut `0.30000000000000004` : un rapprochement bancaire en
  // décimaux finit toujours par un écart d'un millime que personne n'explique.
  assert.equal(MILLIMES_PAR_DINAR, 1000);
  for (const o of Object.values(OFFRES)) {
    assert.ok(Number.isInteger(o.montantMillimes), `${o.reference} n’est pas entier`);
    assert.ok(o.montantMillimes > 0);
  }
  assert.equal(formaterMillimes(90_000), "90,000 DT");
  assert.equal(formaterMillimes(90_500), "90,500 DT");
  assert.equal(formaterMillimes(1), "0,001 DT");
  assert.equal(formaterMillimes(NaN), "—");
});

test("UN REJEU DE WEBHOOK NE LIVRE PAS DEUX FOIS", () => {
  // Les passerelles rejouent leurs notifications : c'est une garantie qu'elles
  // annoncent, pas un incident. Sans mémoire, le dossier partirait deux fois
  // et le paiement serait compté deux fois.
  const c = commande();
  const premier = appliquerStatut(c, "payee", { identifiantWebhook: "evt_1" });
  assert.equal(premier.change, true);
  assert.equal(premier.commande.statut, "payee");

  const rejeu = appliquerStatut(premier.commande, "payee", { identifiantWebhook: "evt_1" });
  assert.equal(rejeu.change, false);
  assert.match(rejeu.raison, /déjà traitée/);
  // Le journal ne s'allonge pas non plus : un rejeu ne laisse pas de trace
  // supplémentaire, sinon la piste d'audit devient illisible.
  assert.equal(rejeu.commande.journal.length, premier.commande.journal.length);
  assert.equal(rejeu.commande.payeeLe, premier.commande.payeeLe);
});

test("UN WEBHOOK EN RETARD NE FAIT PAS RETOMBER UNE COMMANDE PAYÉE", () => {
  const paye = appliquerStatut(commande(), "payee", { identifiantWebhook: "a" }).commande;
  const retard = appliquerStatut(paye, "en-attente", { identifiantWebhook: "b" });
  assert.equal(retard.change, false);
  assert.equal(retard.commande.statut, "payee");
  assert.match(retard.raison, /ne peut pas passer/);
  // Le refus est journalisé : une transition hors séquence est un signal.
  assert.ok(retard.commande.journal.at(-1)?.note?.includes("refusée"));
  // Un échec après paiement ne l'annule pas non plus.
  assert.equal(appliquerStatut(paye, "echouee", {}).commande.statut, "payee");
});

test("seul le remboursement suit un paiement", () => {
  for (const s of statutsPaiement) {
    if (s === "remboursee" || s === "payee") continue;
    assert.equal(transitionPermise("payee", s), false, `payee -> ${s} devrait être refusé`);
  }
  assert.equal(transitionPermise("payee", "remboursee"), true);
  assert.equal(transitionPermise("remboursee", "payee"), false);
});

test("LE LIVRABLE NE PART QUE SI LA COMMANDE EST PAYÉE", () => {
  const enCours = commande();
  assert.equal(donneAcces(enCours), false);
  assert.equal(marquerLivree(enCours).change, false, "une commande impayée ne se livre pas");
  assert.equal(donneAcces(null), false);
  assert.equal(donneAcces(undefined), false);

  const paye = appliquerStatut(enCours, "payee", { identifiantWebhook: "x" }).commande;
  assert.equal(donneAcces(paye), true);
  const livre = marquerLivree(paye);
  assert.equal(livre.change, true);
  assert.equal(livre.commande.livre, true);
  assert.ok(livre.commande.livreLe);
  // Deux livraisons ne se produisent pas.
  assert.equal(marquerLivree(livre.commande).change, false);
});

test("une référence se dicte au téléphone sans ambiguïté", () => {
  // Ni O ni 0, ni I ni 1 : un client qui épelle sa référence à un guichet ne
  // doit pas avoir à préciser « le zéro barré ».
  const vues = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const r = nouvelleReference();
    assert.match(r, /^SOL-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/, r);
    assert.ok(!/[OI01]/.test(r.slice(4)), `${r} contient un caractère ambigu`);
    vues.add(r);
  }
  assert.ok(vues.size > 395, "les références se répètent trop");
});

test("LA VUE CLIENT NE LAISSE PAS FUIR LE JOURNAL INTERNE", () => {
  const c = appliquerStatut(commande(), "payee", {
    identifiantWebhook: "w", referenceFournisseur: "SIM-XYZ", note: "note interne",
  }).commande;
  const vue = vueClient(c);
  const texte = JSON.stringify(vue);
  assert.doesNotMatch(texte, /note interne/);
  assert.doesNotMatch(texte, /SIM-XYZ/);
  assert.doesNotMatch(texte, /webhooksVus/);
  assert.doesNotMatch(texte, /journal/);
  assert.equal(vue.reference, c.reference);
  assert.equal(vue.montantMillimes, 90_000);
});

/* ------------------------------------------------------------- fournisseur */

test("UNE NOTIFICATION NON SIGNÉE N’EST JAMAIS CRUE", () => {
  // Sans vérification, n'importe qui pourrait envoyer « cette commande est
  // payée » à l'adresse du webhook et repartir avec l'étude.
  const corps = JSON.stringify({ reference: "SOL-AAAA-BBBB", evenement: "paye", id: "e1" });
  return simulateur.lireNotification(corps, new Headers()).then(async (sans) => {
    assert.equal(sans.ok, false);
    if (!sans.ok) assert.match(sans.raison, /Signature/);

    const fausse = await simulateur.lireNotification(corps,
      new Headers({ "x-signature": "0".repeat(64) }));
    assert.equal(fausse.ok, false);

    // Une signature valide mais portant sur un AUTRE corps ne passe pas non plus.
    const autre = await simulateur.lireNotification(corps,
      new Headers({ "x-signature": signerNotification("{}") }));
    assert.equal(autre.ok, false);

    const bonne = await simulateur.lireNotification(corps,
      new Headers({ "x-signature": signerNotification(corps) }));
    assert.equal(bonne.ok, true);
    if (bonne.ok) {
      assert.equal(bonne.reference, "SOL-AAAA-BBBB");
      assert.equal(bonne.statut, "payee");
      assert.equal(bonne.identifiant, "e1");
    }
  });
});

test("une notification signée mais incomplète est refusée", async () => {
  for (const charge of [{}, { reference: "SOL-A" }, { reference: "SOL-A", evenement: "paye" },
    { reference: "SOL-A", evenement: "inconnu", id: "e" }]) {
    const corps = JSON.stringify(charge);
    const r = await simulateur.lireNotification(corps,
      new Headers({ "x-signature": signerNotification(corps) }));
    assert.equal(r.ok, false, `${corps} accepté à tort`);
  }
});

test("un échec et un abandon se distinguent", async () => {
  for (const [evenement, attendu] of [["echec", "echouee"], ["abandon", "abandonnee"]]) {
    const corps = JSON.stringify({ reference: "SOL-A", evenement, id: `e-${evenement}` });
    const r = await simulateur.lireNotification(corps,
      new Headers({ "x-signature": signerNotification(corps) }));
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.statut, attendu);
  }
});

test("LE SIMULATEUR REFUSE DE TOURNER EN PRODUCTION", async () => {
  // Une caisse d'essai active sur un site public livrerait des études payantes
  // à qui saurait cliquer « payer », sans jamais rien encaisser.
  const avant = process.env.NODE_ENV;
  try {
    enProduction(true);
    assert.equal(simulateur.configure(), false);
    assert.ok(simulateur.manquant().length > 0);
    const r = await simulateur.creer(commande(),
      { retourUrl: "https://x.tld/r", webhookUrl: "https://x.tld/w" });
    assert.equal(r.ok, false);
  } finally {
    enProduction(avant === "production");
  }
  assert.equal(simulateur.configure(), true);
});

test("AUCUNE PASSERELLE N’EST ACTIVE PAR DÉFAUT EN PRODUCTION", async () => {
  const avantEnv = process.env.NODE_ENV;
  const avantF = process.env.PAIEMENT_FOURNISSEUR;
  try {
    delete process.env.PAIEMENT_FOURNISSEUR;
    enProduction(true);
    assert.equal(fournisseurActif(), null);
    const d = diagnostic();
    assert.equal(d.actif, null);
    assert.ok(d.raisons[0].includes("PAIEMENT_FOURNISSEUR"));

    // Une passerelle inconnue ne devient pas active par erreur de frappe.
    process.env.PAIEMENT_FOURNISSEUR = "paymeee";
    assert.equal(fournisseurActif(), null);
    assert.match(diagnostic().raisons[0], /n’est pas une passerelle connue/);
  } finally {
    enProduction(avantEnv === "production");
    if (avantF === undefined) delete process.env.PAIEMENT_FOURNISSEUR;
    else process.env.PAIEMENT_FOURNISSEUR = avantF;
  }
  assert.equal(fournisseurParId("simulateur")?.id, "simulateur");
  assert.equal(fournisseurParId("inexistant"), null);
  assert.equal(fournisseurParId(null), null);
});

test("créer une transaction rend une adresse de paiement", async () => {
  const c = commande();
  const r = await simulateur.creer(c,
    { retourUrl: "https://x.tld/retour", webhookUrl: "https://x.tld/webhook" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(r.url.includes(c.reference));
    assert.ok(r.url.includes(String(c.montantMillimes)));
    assert.ok(r.reference?.startsWith("SIM-"));
  }
});
