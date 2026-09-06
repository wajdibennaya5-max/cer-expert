import test from "node:test";
import assert from "node:assert/strict";
import { creerFlouci, CHAMPS } from "@/lib/paiement/fournisseurs/flouci";
import { creerCommande, montantConforme } from "@/lib/paiement/commandes";
import type { Commande } from "@/lib/paiement/types";

const CLIENT = { nom: "Ali Ben Salah", telephone: "20123456" };

function commande(reference = "FLOUCI-TEST"): Commande {
  const r = creerCommande({ offre: "etude-detaillee", client: CLIENT, fournisseur: "flouci" });
  if (!r.ok) throw new Error(r.raison);
  return { ...r.commande, referenceFournisseur: reference };
}

/** Une passerelle simulée : on décide exactement ce qu'elle répond. */
function passerelle(reponses: Array<{ status?: number; corps?: unknown; retard?: number
  ; erreur?: Error }>) {
  const appels: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const requete = (async (url: string | URL | Request, init: RequestInit = {}) => {
    appels.push({ url: String(url), init });
    const r = reponses[Math.min(i++, reponses.length - 1)];
    if (r.erreur) throw r.erreur;
    if (r.retard) {
      await new Promise((resoudre, rejeter) => {
        const minuteur = setTimeout(resoudre, r.retard);
        init.signal?.addEventListener("abort", () => {
          clearTimeout(minuteur);
          const e = new Error("aborted");
          e.name = "AbortError";
          rejeter(e);
        });
      });
    }
    return new Response(
      typeof r.corps === "string" ? r.corps : JSON.stringify(r.corps ?? {}),
      { status: r.status ?? 200 },
    );
  }) as unknown as typeof fetch;
  return { requete, appels };
}

const AVEC_CLES = async (fn: () => Promise<void> | void) => {
  const av = { t: process.env.FLOUCI_APP_TOKEN, s: process.env.FLOUCI_APP_SECRET };
  process.env.FLOUCI_APP_TOKEN = "jeton-public";
  process.env.FLOUCI_APP_SECRET = "cle-privee";
  try { await fn(); } finally {
    if (av.t === undefined) delete process.env.FLOUCI_APP_TOKEN; else process.env.FLOUCI_APP_TOKEN = av.t;
    if (av.s === undefined) delete process.env.FLOUCI_APP_SECRET; else process.env.FLOUCI_APP_SECRET = av.s;
  }
};

test("SANS CLÉS, FLOUCI NE PRÉTEND PAS FONCTIONNER", async () => {
  const av = { t: process.env.FLOUCI_APP_TOKEN, s: process.env.FLOUCI_APP_SECRET };
  delete process.env.FLOUCI_APP_TOKEN;
  delete process.env.FLOUCI_APP_SECRET;
  try {
    const f = creerFlouci(passerelle([{ corps: {} }]).requete);
    assert.equal(f.configure(), false);
    assert.ok(f.manquant()[0].includes("FLOUCI_APP_TOKEN"));
    assert.ok(f.manquant()[0].includes("FLOUCI_APP_SECRET"));
    const c = await f.creer(commande(), { retourUrl: "https://x.tld/r", webhookUrl: "https://x.tld/w" });
    assert.equal(c.ok, false);
    assert.equal((await f.verifier(commande())).ok, false);
  } finally {
    if (av.t !== undefined) process.env.FLOUCI_APP_TOKEN = av.t;
    if (av.s !== undefined) process.env.FLOUCI_APP_SECRET = av.s;
  }
});

test("LE MONTANT ENVOYÉ EST CELUI DE LA COMMANDE, EN MILLIMES", () => AVEC_CLES(async () => {
  const g = passerelle([{ corps: { result: { link: "https://flouci.com/pay/abc", payment_id: "p1" } } }]);
  const f = creerFlouci(g.requete);
  const c = commande();
  const r = await f.creer(c, { retourUrl: "https://x.tld/r", webhookUrl: "https://x.tld/w" });
  assert.ok(r.ok);

  const corps = JSON.parse(String(g.appels[0].init.body));
  assert.equal(corps.amount, "90000", "Flouci attend des millimes, pas des dinars");
  assert.equal(corps.client_id, c.reference, "notre référence doit voyager avec la transaction");
  assert.equal(corps.webhook, "https://x.tld/w");
  assert.ok(String(corps.success_link).includes("succes"));
  assert.ok(String(corps.fail_link).includes("echec"));
  // La clé privée part bien dans l'appel serveur — et nulle part ailleurs.
  assert.equal(corps.app_secret, "cle-privee");
  assert.ok(g.appels[0].url.endsWith(CHAMPS.creation));
}));

test("l’adresse de paiement se lit quelle que soit l’orthographe de la clé", () =>
  AVEC_CLES(async () => {
    // La documentation n'étant pas joignable, plusieurs orthographes sont
    // acceptées. Ce test fige lesquelles — et sert de mode d'emploi le jour
    // où il faudra en ajouter une.
    for (const corps of [
      { link: "https://flouci.com/a", payment_id: "1" },
      { result: { link: "https://flouci.com/b", payment_id: "2" } },
      { payment_url: "https://flouci.com/c", paymentId: "3" },
      { result: { payment_url: "https://flouci.com/d", id: "4" } },
    ]) {
      const f = creerFlouci(passerelle([{ corps }]).requete);
      const r = await f.creer(commande(), { retourUrl: "https://x/r", webhookUrl: "https://x/w" });
      assert.ok(r.ok, `non lu : ${JSON.stringify(corps)}`);
      if (r.ok) {
        assert.ok(r.url.startsWith("https://flouci.com/"));
        assert.ok(r.reference);
      }
    }
  }));

test("UNE RÉPONSE INATTENDUE N’EST PAS UN DEMI-SUCCÈS", () => AVEC_CLES(async () => {
  // Sans adresse de paiement valide, envoyer le client quelque part serait
  // pire que de refuser.
  for (const corps of [{}, { link: "" }, { link: "pas-une-url" },
    { link: "http://flouci.com/a" }, { result: {} }, null, "du texte"]) {
    const f = creerFlouci(passerelle([{ corps }]).requete);
    const r = await f.creer(commande(), { retourUrl: "https://x/r", webhookUrl: "https://x/w" });
    assert.equal(r.ok, false, `${JSON.stringify(corps)} accepté à tort`);
  }
}));

test("une passerelle en panne, muette ou lente ne bloque pas la page", () =>
  AVEC_CLES(async () => {
    const enPanne = creerFlouci(passerelle([{ status: 502, corps: { erreur: "oups" } }]).requete);
    const a = await enPanne.creer(commande(), { retourUrl: "https://x/r", webhookUrl: "https://x/w" });
    assert.equal(a.ok, false);
    // Le corps d'erreur de la banque n'est jamais relayé : il peut contenir
    // des identifiants de compte ou des détails d'infrastructure.
    if (!a.ok) assert.doesNotMatch(a.raison, /oups/);

    const injoignable = creerFlouci(passerelle([{ erreur: new Error("ECONNREFUSED") }]).requete);
    const b = await injoignable.creer(commande(), { retourUrl: "https://x/r", webhookUrl: "https://x/w" });
    assert.equal(b.ok, false);
    if (!b.ok) assert.match(b.raison, /injoignable/);

    const illisible = creerFlouci(passerelle([{ corps: "<html>maintenance</html>" }]).requete);
    const c = await illisible.creer(commande(), { retourUrl: "https://x/r", webhookUrl: "https://x/w" });
    assert.equal(c.ok, false);
  }));

test("UN STATUT INCONNU N’EST PAS UN PAIEMENT", () => AVEC_CLES(async () => {
  // Traiter un état incompris comme un succès serait la porte ouverte la plus
  // large qu'on puisse laisser.
  for (const status of ["", "WAT", "OK", "true", null, undefined, 1]) {
    const f = creerFlouci(passerelle([{ corps: { result: { status } } }]).requete);
    const r = await f.verifier(commande());
    assert.equal(r.ok, false, `« ${String(status)} » accepté à tort`);
  }
}));

test("les états connus de Flouci se traduisent dans le vocabulaire du projet", () =>
  AVEC_CLES(async () => {
    for (const [flouci, attendu] of [["SUCCESS", "payee"], ["success", "payee"],
      ["FAILURE", "echouee"], ["CANCELLED", "abandonnee"], ["PENDING", "en-attente"]]) {
      const f = creerFlouci(passerelle([{ corps: { result: { status: flouci } } }]).requete);
      const r = await f.verifier(commande());
      assert.ok(r.ok, flouci);
      if (r.ok) assert.equal(r.statut, attendu, flouci);
    }
  }));

test("vérifier sans transaction ouverte ne demande rien à la banque", () =>
  AVEC_CLES(async () => {
    const g = passerelle([{ corps: { result: { status: "SUCCESS" } } }]);
    const f = creerFlouci(g.requete);
    const sansReference = { ...commande(), referenceFournisseur: undefined };
    const r = await f.verifier(sansReference as Commande);
    assert.equal(r.ok, false);
    assert.equal(g.appels.length, 0, "aucun appel ne doit partir");
  }));

test("LE WEBHOOK N’ACCORDE JAMAIS UN PAIEMENT", () => AVEC_CLES(async () => {
  // Même en criant « SUCCESS », une notification ne fait que désigner la
  // commande à vérifier. C'est ce qui rend sans danger le fait que Flouci ne
  // signe peut-être pas ses notifications.
  const f = creerFlouci(passerelle([{ corps: {} }]).requete);
  const r = await f.lireNotification(
    { client_id: "SOL-AAAA-BBBB", payment_id: "p9", status: "SUCCESS", amount: "1" },
    new Headers(),
  );
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.reference, "SOL-AAAA-BBBB");
    assert.equal(r.statut, "en-attente", "un webhook ne paie pas");
  }
  // Sans référence, on ne sait même pas quoi vérifier.
  assert.equal((await f.lireNotification({ status: "SUCCESS" }, new Headers())).ok, false);
}));

test("UN PAIEMENT AUTHENTIQUE D’UN DINAR SUR UNE COMMANDE DE QUATRE-VINGT-DIX EST REFUSÉ", () => {
  // La signature est bonne, la banque confirme, le journal est propre — et
  // l'étude serait offerte. Une comparaison d'entiers suffit à l'empêcher.
  const c = commande();
  assert.equal(montantConforme(c, 90_000).conforme, true);
  assert.equal(montantConforme(c, 1_000).conforme, false);
  assert.equal(montantConforme(c, 89_999).conforme, false, "un millime est un écart");
  assert.equal(montantConforme(c, 900_000).conforme, false);
  assert.equal(montantConforme(c, Number.NaN).conforme, false);
  // Toutes les passerelles n'annoncent pas le montant : refuser faute
  // d'information bloquerait des paiements légitimes.
  assert.equal(montantConforme(c, undefined).conforme, true);
});

test("FLOUCI EST DANS LE REGISTRE, ET N’Y EST ACTIF QUE CONFIGURÉ", async () => {
  const { fournisseurParId, fournisseurActif, diagnostic } =
    await import("@/lib/paiement/fournisseurs");
  assert.equal(fournisseurParId("flouci")?.id, "flouci");

  const av = {
    f: process.env.PAIEMENT_FOURNISSEUR,
    t: process.env.FLOUCI_APP_TOKEN,
    s: process.env.FLOUCI_APP_SECRET,
  };
  try {
    process.env.PAIEMENT_FOURNISSEUR = "flouci";
    delete process.env.FLOUCI_APP_TOKEN;
    delete process.env.FLOUCI_APP_SECRET;
    // Déclaré mais sans clés : la caisse reste fermée, et elle dit pourquoi.
    assert.equal(fournisseurActif(), null);
    assert.match(diagnostic().raisons[0], /FLOUCI_APP_TOKEN/);

    process.env.FLOUCI_APP_TOKEN = "t";
    process.env.FLOUCI_APP_SECRET = "s";
    assert.equal(fournisseurActif()?.id, "flouci");
    assert.deepEqual(diagnostic(), { actif: "flouci", raisons: [] });
  } finally {
    for (const [cle, valeur] of [["PAIEMENT_FOURNISSEUR", av.f],
      ["FLOUCI_APP_TOKEN", av.t], ["FLOUCI_APP_SECRET", av.s]] as const) {
      if (valeur === undefined) delete process.env[cle];
      else process.env[cle] = valeur;
    }
  }
});
