import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resoudreChemin } from "node:path";

const RACINE = resoudreChemin(process.cwd(), "src");

/** Le premier fichier qui existe parmi les extensions TypeScript usuelles. */
function premierExistant(base) {
  for (const suffixe of [".ts", ".tsx", "/index.ts", "/index.tsx", ""]) {
    const candidat = base + suffixe;
    if (suffixe === "" ? existsSync(candidat) : existsSync(candidat)) return candidat;
  }
  return null;
}

export function resolve(specifieur, contexte, suivant) {
  // L'alias « @/ » du projet pointe sur « src/ ».
  if (specifieur.startsWith("@/")) {
    const trouve = premierExistant(resoudreChemin(RACINE, specifieur.slice(2)));
    if (trouve) return { url: pathToFileURL(trouve).href, shortCircuit: true };
  }
  // Un chemin relatif sans extension : TypeScript l'accepte, Node non.
  if (specifieur.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifieur)) {
    const depuis = contexte.parentURL ? dirname(fileURLToPath(contexte.parentURL)) : process.cwd();
    const trouve = premierExistant(resoudreChemin(depuis, specifieur));
    if (trouve) return { url: pathToFileURL(trouve).href, shortCircuit: true };
  }
  return suivant(specifieur, contexte);
}
