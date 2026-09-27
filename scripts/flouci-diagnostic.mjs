#!/usr/bin/env node
/**
 * INTERROGE FLOUCI AVEC VOS VRAIES CLÉS, ET IMPRIME LA RÉPONSE BRUTE.
 *
 *   npm run paiement:flouci
 *
 * POURQUOI CE SCRIPT EXISTE. L'adaptateur `src/lib/paiement/fournisseurs/flouci.ts`
 * a été écrit sans accès à la documentation officielle de Flouci — elle était
 * injoignable depuis l'environnement de développement. Les noms de champs
 * viennent d'intégrations publiques existantes, pas d'une lecture de la
 * documentation.
 *
 * Plutôt que de vous laisser découvrir l'écart au premier vrai client, ce
 * script demande à Flouci et affiche EXACTEMENT ce qu'il répond. Si un nom de
 * champ diffère, la correction tient en une ligne dans `CHAMPS`.
 *
 * IL N'ENCAISSE RIEN : il ouvre une transaction d'un millime et vous donne
 * l'adresse. Personne n'est débité tant que vous ne payez pas vous-même.
 *
 * Les clés sont lues dans .env.local et ne sont jamais affichées.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const RACINE = resolve(new URL("..", import.meta.url).pathname);

/** Lit .env.local sans dépendance : quelques lignes suffisent. */
function environnement() {
  const chemin = resolve(RACINE, ".env.local");
  if (!existsSync(chemin)) return {};
  const valeurs = {};
  for (const ligne of readFileSync(chemin, "utf8").split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#")) continue;
    const coupe = nette.indexOf("=");
    if (coupe < 1) continue;
    valeurs[nette.slice(0, coupe).trim()] =
      nette.slice(coupe + 1).trim().replace(/^["']|["']$/g, "");
  }
  return valeurs;
}

const env = { ...environnement(), ...process.env };
const TOKEN = env.FLOUCI_APP_TOKEN;
const SECRET = env.FLOUCI_APP_SECRET;
const BASE = env.FLOUCI_BASE_URL || "https://developers.flouci.com/api";

if (!TOKEN || !SECRET) {
  console.error("Il manque FLOUCI_APP_TOKEN et FLOUCI_APP_SECRET dans .env.local.");
  console.error("Ces deux valeurs se trouvent dans votre espace développeur Flouci.");
  process.exit(1);
}

/** N'imprime jamais un secret, même tronqué de travers. */
const masquer = (texte) =>
  String(texte).replaceAll(TOKEN, "«APP_TOKEN»").replaceAll(SECRET, "«APP_SECRET»");

console.log(`Passerelle : ${BASE}`);
console.log(`Jeton public : ${TOKEN.slice(0, 4)}… (${TOKEN.length} caractères)`);
console.log(`Clé privée   : ${SECRET.length} caractères, jamais affichée\n`);

const entetes = {
  "content-type": "application/json",
  apppublic: TOKEN,
  appsecret: SECRET,
  authorization: `Bearer ${TOKEN}:${SECRET}`,
};

console.log("── 1. Ouverture d’une transaction d’UN MILLIME ────────────────");
let creation;
try {
  const reponse = await fetch(`${BASE}/v2/generate_payment`, {
    method: "POST",
    headers: entetes,
    body: JSON.stringify({
      app_token: TOKEN,
      app_secret: SECRET,
      amount: "1",
      accept_card: "true",
      session_timeout_secs: 1200,
      success_link: "https://20122011.xyz/paiement/retour?issue=succes",
      fail_link: "https://20122011.xyz/paiement/retour?issue=echec",
      webhook: "https://20122011.xyz/api/paiement/webhook/flouci",
      developer_tracking_id: env.FLOUCI_TRACKING_ID || "solarys",
      client_id: "DIAGNOSTIC-0001",
    }),
  });
  const texte = await reponse.text();
  console.log(`HTTP ${reponse.status}`);
  console.log(masquer(texte));
  try { creation = JSON.parse(texte); } catch { /* réponse non JSON : déjà affichée */ }
} catch (erreur) {
  console.error("Appel impossible :", masquer(erreur?.message ?? erreur));
  console.error("\nSi vous lisez « fetch failed » depuis un conteneur, c’est le réseau");
  console.error("sortant qui bloque — relancez ce script depuis votre serveur.");
  process.exit(1);
}

/** Cherche une clé où qu'elle soit, pour dire à quel chemin elle se trouve. */
function chemins(objet, cible, prefixe = "") {
  const trouves = [];
  if (!objet || typeof objet !== "object") return trouves;
  for (const [cle, valeur] of Object.entries(objet)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (cible.test(cle)) trouves.push(`${chemin} = ${JSON.stringify(valeur)}`);
    trouves.push(...chemins(valeur, cible, chemin));
  }
  return trouves;
}

console.log("\n── 2. Où se trouvent les champs que l’adaptateur cherche ──────");
const urls = chemins(creation, /^(link|payment_url|url)$/i);
const ids = chemins(creation, /^(payment_?id|id)$/i);
console.log("Adresse de paiement :", urls.length ? urls.join(" | ") : "INTROUVABLE");
console.log("Identifiant         :", ids.length ? masquer(ids.join(" | ")) : "INTROUVABLE");

if (!urls.length || !ids.length) {
  console.log("\n⚠ Un champ manque. Ajoutez son chemin exact dans CHAMPS,");
  console.log("  fichier src/lib/paiement/fournisseurs/flouci.ts.");
  process.exit(2);
}

const identifiant = String(ids[0].split(" = ")[1]).replace(/"/g, "");
console.log(`\nOuvrez cette adresse pour payer 1 millime, puis relancez avec :`);
console.log(`  npm run paiement:flouci -- ${identifiant}`);
console.log(`Adresse : ${urls[0].split(" = ")[1]}`);

console.log("\n── 3. Vérification serveur à serveur ──────────────────────────");
const aVerifier = process.argv[2] || identifiant;
try {
  const reponse = await fetch(`${BASE}/verify_payment/${encodeURIComponent(aVerifier)}`, {
    headers: entetes,
  });
  const texte = await reponse.text();
  console.log(`HTTP ${reponse.status}`);
  console.log(masquer(texte));
  let corps;
  try { corps = JSON.parse(texte); } catch { /* déjà affichée */ }
  const statuts = chemins(corps, /^(status|state)$/i);
  const montants = chemins(corps, /^amount$/i);
  console.log("\nStatut  :", statuts.length ? statuts.join(" | ") : "INTROUVABLE");
  console.log("Montant :", montants.length ? montants.join(" | ") : "non annoncé");
  if (montants.length) {
    console.log("→ Vérifiez l’UNITÉ : « 1 » signifie millimes, « 0.001 » signifie dinars.");
    console.log("  L’adaptateur suppose des millimes. Un écart d’un facteur mille");
    console.log("  ferait payer 90 millimes au lieu de 90 dinars.");
  }
} catch (erreur) {
  console.error("Vérification impossible :", masquer(erreur?.message ?? erreur));
}
