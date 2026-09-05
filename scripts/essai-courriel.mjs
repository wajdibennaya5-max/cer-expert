/**
 * Envoie un courriel d'essai avec la configuration en place.
 *
 *   node scripts/essai-courriel.mjs
 *
 * Les identifiants sont lus dans .env.local, jamais passés en argument : un
 * argument serait lisible par n'importe quel programme via `ps`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

const racine = path.resolve(import.meta.dirname, "..");

/** Lit .env.local sans dépendance : une ligne `CLE=valeur` par entrée. */
async function lireConf() {
  const conf = {};
  let brut = "";
  try {
    brut = await readFile(path.join(racine, ".env.local"), "utf8");
  } catch {
    return conf;
  }
  for (const ligne of brut.split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(ligne.trim());
    if (!m) continue;
    // Les guillemets encadrants sont retirés : ils font partie de l'écriture,
    // pas de la valeur.
    conf[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return conf;
}

const conf = await lireConf();
const manquants = ["SMTP_HOTE", "SMTP_UTILISATEUR", "SMTP_MOTDEPASSE", "COURRIEL_EQUIPE"]
  .filter((cle) => !conf[cle]);

if (manquants.length) {
  console.error(`✗ Configuration incomplète dans .env.local : ${manquants.join(", ")}`);
  console.error("  Lancez : bash scripts/courriel.sh");
  process.exit(1);
}

const port = Number(conf.SMTP_PORT) || 465;
const destinataire = conf.COURRIEL_EQUIPE.split(",")[0].trim();

console.log(`→ Serveur   : ${conf.SMTP_HOTE}:${port}`);
console.log(`→ Compte    : ${conf.SMTP_UTILISATEUR}`);
console.log(`→ Envoi à   : ${destinataire}`);
console.log("");

const transport = nodemailer.createTransport({
  host: conf.SMTP_HOTE,
  port,
  secure: port !== 587,
  auth: { user: conf.SMTP_UTILISATEUR, pass: conf.SMTP_MOTDEPASSE },
  // Sans délai, une adresse injoignable fait attendre indéfiniment, sans rien
  // afficher : sur un téléphone en réseau faible, on croit à un plantage.
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 20_000,
});

try {
  await transport.verify();
  console.log("✓ Le serveur accepte la connexion et les identifiants.");
} catch (erreur) {
  console.error("✗ Le serveur a refusé la connexion.");
  console.error(`  ${erreur.message}`);
  // Les erreurs les plus fréquentes, dites en clair plutôt qu'en code SMTP.
  if (/auth/i.test(erreur.message)) {
    console.error("  → Identifiant ou mot de passe incorrect. Chez Brevo, le mot de");
    console.error("    passe SMTP n'est PAS celui du compte : il se trouve dans");
    console.error("    « SMTP & API », onglet SMTP, ligne « Master password ».");
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(erreur.message)) {
    console.error("  → Serveur injoignable : vérifiez le nom et le port,");
    console.error("    et que le téléphone a bien du réseau.");
  }
  process.exit(1);
}

try {
  const info = await transport.sendMail({
    from: conf.COURRIEL_EXPEDITEUR || conf.SMTP_UTILISATEUR,
    to: destinataire,
    subject: "Essai — les notifications fonctionnent",
    text: [
      "Si vous lisez ceci, la configuration est bonne.",
      "",
      "Chaque demande reçue sur le site déclenchera désormais deux courriels :",
      "celui-ci pour vous, avec tout ce qu'il faut pour rappeler, et un autre",
      "pour le client, avec son étude par écrit.",
      "",
      "Wajdi & Tayssir — Solarys",
    ].join("\n"),
  });
  console.log(`✓ Courriel envoyé (${info.messageId}).`);
  console.log("");
  console.log("  Regardez votre boîte — et le dossier « indésirables » la");
  console.log("  première fois : un domaine neuf y atterrit souvent.");
} catch (erreur) {
  console.error("✗ L'envoi a échoué.");
  console.error(`  ${erreur.message}`);
  if (/sender|from|not authorized|domain/i.test(erreur.message)) {
    console.error("  → L'expéditeur doit être une adresse VÉRIFIÉE chez votre");
    console.error("    fournisseur. Chez Brevo : « Expéditeurs », ajoutez");
    console.error("    contact@20122011.xyz et validez-la.");
  }
  process.exit(1);
}
