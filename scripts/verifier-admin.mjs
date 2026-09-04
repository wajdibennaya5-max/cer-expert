#!/usr/bin/env node
/**
 * Compare un mot de passe à l'empreinte enregistrée, et — si une adresse est
 * fournie — essaie réellement de se connecter au serveur en cours d'exécution.
 *
 * Ces deux vérifications séparent les deux pannes possibles, qui donnent le
 * même message à l'écran :
 *   • le mot de passe enregistré n'est pas celui que l'on croit ;
 *   • il est bon, mais le serveur tourne encore avec l'ancienne configuration.
 *
 * Le mot de passe arrive par l'entrée standard — jamais en argument, où il
 * serait lisible par n'importe quel programme via `ps`, ni dans un fichier.
 * L'empreinte et l'identifiant passent par l'environnement : ce ne sont pas
 * des secrets réutilisables, et l'empreinte est irréversible.
 *
 * Appelé par scripts/verifier-admin.sh ; sortie en lignes « clé=valeur ».
 */
import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Miroir exact de verifyPassword() dans src/lib/auth.ts. Si l'une des deux
 * change, changer l'autre : un diagnostic qui ne dit pas la même chose que le
 * site serait pire que pas de diagnostic du tout.
 */
function correspond(motDePasse, empreinte) {
  const parties = empreinte.includes(":") ? empreinte.split(":") : empreinte.split("$");
  if (parties.length !== 3 || parties[0] !== "scrypt") return false;
  try {
    const sel = Buffer.from(parties[1], "hex");
    const attendu = Buffer.from(parties[2], "hex");
    const derive = scryptSync(motDePasse, sel, attendu.length);
    return timingSafeEqual(derive, attendu);
  } catch {
    return false;
  }
}

function lireEntree() {
  return new Promise((resolve) => {
    let texte = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (morceau) => (texte += morceau));
    process.stdin.on("end", () => resolve(texte.replace(/\r?\n$/, "")));
  });
}

const motDePasse = await lireEntree();
const empreinte = process.env.EMPREINTE ?? "";
const identifiant = process.env.IDENTIFIANT ?? "";

console.log(`correspondance=${empreinte && correspond(motDePasse, empreinte) ? "oui" : "non"}`);

const adresse = process.env.ADRESSE ?? "";
if (adresse) {
  try {
    const reponse = await fetch(`${adresse}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifiant, password: motDePasse }),
    });
    console.log(`serveur=${reponse.status}`);
  } catch {
    console.log("serveur=000");
  }
}
