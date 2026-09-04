#!/usr/bin/env node
/**
 * Génère la valeur à placer dans ADMIN_PASSWORD_HASH.
 *
 * Deux usages :
 *   • sans argument, le mot de passe est lu sur l'entrée standard — c'est la
 *     voie sûre, utilisée par `scripts/mot-de-passe.sh` ;
 *   • avec un argument, pour compatibilité :
 *       npm run admin:password -- "mon mot de passe"
 *
 * Le passage en argument laisse le mot de passe dans l'historique du terminal
 * et le rend visible par `ps` le temps de l'exécution. Préférez le script
 * dédié, qui masque la saisie.
 */
import { randomBytes, scryptSync } from "node:crypto";

const MINIMUM = 10;

function empreinte(motDePasse) {
  if (motDePasse.length < MINIMUM) {
    console.error(`Choisissez un mot de passe d'au moins ${MINIMUM} caractères.`);
    process.exit(1);
  }
  const sel = randomBytes(16);
  const derive = scryptSync(motDePasse, sel, 64);
  // Séparateur « : » et non « $ » : dans un fichier .env, Next.js remplacerait
  // « $sel » par une variable d'environnement inexistante, donc par du vide.
  console.log(`ADMIN_PASSWORD_HASH=scrypt:${sel.toString("hex")}:${derive.toString("hex")}`);
}

const argument = process.argv[2];
if (argument) {
  empreinte(argument);
} else if (!process.stdin.isTTY) {
  let entree = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (morceau) => (entree += morceau));
  process.stdin.on("end", () => empreinte(entree.replace(/\r?\n$/, "")));
} else {
  console.error('Utilisation : npm run admin:password -- "votre-mot-de-passe"');
  console.error("Ou, plus sûr :  bash scripts/mot-de-passe.sh");
  process.exit(1);
}
