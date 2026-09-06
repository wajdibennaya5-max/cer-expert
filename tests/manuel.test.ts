import test from "node:test";
import assert from "node:assert/strict";
import { manuel, canaux, masquer } from "@/lib/paiement/fournisseurs/manuel";
import { confirmer, confirmerParAdmin } from "@/lib/paiement/confirmer";
import { creerCommande, donneAcces } from "@/lib/paiement/commandes";
import type { Commande } from "@/lib/paiement/types";

const CLIENT = { nom: "Ali Ben Salah", telephone: "20123456" };
const commande = (): Commande => {
  const r = creerCommande({ offre: "etude-detaillee", client: CLIENT, fournisseur: "manuel" });
  if (!r.ok) throw new Error(r.raison);
  return r.commande;
};

const CLES = ["PAIEMENT_FLOUCI_TELEPHONE", "PAIEMENT_FLOUCI_NOM", "PAIEMENT_RIB",
  "PAIEMENT_IBAN", "PAIEMENT_SWIFT", "PAIEMENT_TITULAIRE", "PAIEMENT_BANQUE"] as const;

async function avecEnvironnement(
  valeurs: Partial<Record<(typeof CLES)[number], string>>,
  fn: () => Promise<void> | void,
) {
  const avant = Object.fromEntries(CLES.map((c) => [c, process.env[c]]));
  for (const c of CLES) delete process.env[c];
  for (const [c, v] of Object.entries(valeurs)) process.env[c] = v;
  try { await fn(); } finally {
    for (const c of CLES) {
      if (avant[c] === undefined) delete process.env[c];
      else process.env[c] = avant[c];
    }
  }
}

test("UN PAIEMENT MANUEL NE SE CONFIRME JAMAIS TOUT SEUL", async () => {
  // C'est toute la raison d'être de ce fournisseur. Un virement n'a ni
  // webhook ni appel de vérification : prétendre le confirmer livrerait
  // l'étude à qui clique « j'ai payé ».
  await avecEnvironnement({ PAIEMENT_RIB: "24 031 170 5822 511101 05" }, async () => {
    const c = commande();
    const v = await manuel.verifier(c);
    assert.ok(v.ok);
    if (v.ok) assert.equal(v.statut, "en-attente");

    // Même en passant par le chemin normal de confirmation, on n'arrive pas
    // à « payée ».
    const apres = await confirmer(c);
    assert.notEqual(apres.commande.statut, "payee");
    assert.equal(donneAcces(apres.commande), false);
  });
});

test("aucune notification extérieure n’est acceptée", async () => {
  const r = await manuel.lireNotification({ reference: "SOL-A", statut: "payee" }, new Headers());
  assert.equal(r.ok, false);
});

test("SANS COORDONNÉES, LE PAIEMENT MANUEL NE PRÉTEND PAS FONCTIONNER", async () => {
  await avecEnvironnement({}, async () => {
    assert.deepEqual(canaux(), []);
    assert.equal(manuel.configure(), false);
    assert.ok(manuel.manquant()[0].includes("PAIEMENT_RIB"));
    // Et il dit de ne pas les mettre dans le code.
    assert.match(manuel.manquant()[0], /jamais dans le code/);
    const c = await manuel.creer(commande(), { retourUrl: "", webhookUrl: "" });
    assert.equal(c.ok, false);
  });
});

test("un canal dont les variables manquent n’apparaît pas", async () => {
  // Afficher « RIB : non configuré » sur une page de paiement serait pire que
  // de ne pas proposer le virement.
  await avecEnvironnement({ PAIEMENT_FLOUCI_TELEPHONE: "54062596" }, () => {
    const liste = canaux();
    assert.equal(liste.length, 1);
    assert.equal(liste[0].id, "flouci");
    assert.ok(liste.every((canal) => canal.lignes.every((l) => l.valeur.trim().length > 0)));
  });
  await avecEnvironnement({ PAIEMENT_IBAN: "TN59 24 031 170 5822 511101 05" }, () => {
    const liste = canaux();
    assert.equal(liste.length, 1);
    assert.equal(liste[0].id, "virement");
    assert.ok(liste[0].lignes.some((l) => l.libelle === "IBAN"));
    assert.ok(!liste[0].lignes.some((l) => l.libelle === "RIB"), "aucun champ vide");
  });
});

test("les deux canaux coexistent, chacun avec son mode d’emploi", async () => {
  await avecEnvironnement({
    PAIEMENT_FLOUCI_TELEPHONE: "54062596",
    PAIEMENT_FLOUCI_NOM: "Wajdi Bennaya",
    PAIEMENT_RIB: "24 031 170 5822 511101 05",
    PAIEMENT_IBAN: "TN59 24 031 170 5822 511101 05",
    PAIEMENT_SWIFT: "BTEXTNTT",
    PAIEMENT_TITULAIRE: "Wajdi Bennaya",
    PAIEMENT_BANQUE: "Banque de Tunisie et des Emirats",
  }, () => {
    const liste = canaux();
    assert.equal(liste.length, 2);
    assert.equal(manuel.configure(), true);
    for (const canal of liste) {
      assert.ok(canal.aide.length > 30, `${canal.id} sans mode d’emploi`);
      assert.ok(canal.lignes.length > 0);
    }
    // Ce qu'il faut recopier est marqué copiable : un IBAN retapé à la main
    // sur un clavier de téléphone se trompe une fois sur trois.
    assert.ok(liste[0].lignes.some((l) => l.copiable));
    assert.ok(liste[1].lignes.some((l) => l.copiable));
  });
});

test("UN RIB NE PART PAS ENTIER DANS UN JOURNAL", () => {
  // Un RIB complet recopié dans un journal finit dans des sauvegardes et des
  // outils de supervision que personne n'a pensé à protéger.
  const m = masquer("24 031 170 5822 511101 05");
  assert.ok(m.endsWith("0105"));
  assert.doesNotMatch(m, /24031170/);
  assert.equal(masquer("12"), "••");
  assert.equal(masquer(""), "");
});

/* --------------------------------------------------- confirmation humaine */

test("SEUL UN HUMAIN FAIT PASSER UNE COMMANDE MANUELLE À « PAYÉE »", () => {
  const c = commande();
  const r = confirmerParAdmin(c, { par: "wajdi", reference: "VIR-20260906-11" });
  assert.equal(r.change, true);
  assert.equal(r.commande.statut, "payee");
  assert.equal(donneAcces(r.commande), true);
  // La signature est journalisée : une commande passée à « payée » sans trace
  // serait indiscernable d'une fraude interne.
  const dernier = r.commande.journal.at(-1);
  assert.equal(dernier?.source, "admin");
  assert.match(dernier?.note ?? "", /wajdi/);
  assert.match(dernier?.note ?? "", /VIR-20260906-11/);
  assert.ok(r.commande.payeeLe);
});

test("une confirmation non signée est refusée", () => {
  for (const par of ["", "   ", undefined as unknown as string]) {
    const r = confirmerParAdmin(commande(), { par });
    assert.equal(r.change, false);
    assert.match(r.raison, /signée/);
  }
});

test("UN VIREMENT DE NEUF DINARS SUR UNE COMMANDE DE QUATRE-VINGT-DIX EST REFUSÉ", () => {
  // Le contrôle se fait au moment de la saisie, pas trois mois plus tard dans
  // un rapprochement bancaire.
  const c = commande();
  const trop = confirmerParAdmin(c, { par: "wajdi", montantRecu: 9_000 });
  assert.equal(trop.change, false);
  assert.match(trop.raison, /différent du montant dû/);
  assert.equal(trop.commande.statut, "creee");

  const juste = confirmerParAdmin(c, { par: "wajdi", montantRecu: 90_000 });
  assert.equal(juste.change, true);
  assert.equal(juste.commande.statut, "payee");
});

test("confirmer deux fois ne change rien la seconde", () => {
  const paye = confirmerParAdmin(commande(), { par: "wajdi" }).commande;
  const encore = confirmerParAdmin(paye, { par: "wajdi" });
  assert.equal(encore.change, false);
  assert.equal(encore.commande.statut, "payee");
});
