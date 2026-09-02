#!/usr/bin/env node
/**
 * Génère la valeur à placer dans ADMIN_PASSWORD_HASH.
 * Utilisation : npm run admin:password -- "mon mot de passe"
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Utilisation : npm run admin:password -- "votre-mot-de-passe"');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Choisissez un mot de passe d'au moins 10 caractères.");
  process.exit(1);
}
const salt = randomBytes(16);
const derived = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString("hex")}$${derived.toString("hex")}`);
