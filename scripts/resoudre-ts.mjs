/**
 * Permet à `node --test` de charger les modules TypeScript du projet.
 *
 * TypeScript et Next.js résolvent « ./offre » vers « ./offre.ts », et « @/lib/x »
 * vers « src/lib/x.ts ». Node, lui, exige l'extension et ne connaît pas les
 * alias. Sans ce crochet, les tests devraient importer autrement que le code
 * de production — et testeraient donc autre chose que ce qui tourne.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resoudre-ts-crochet.mjs", pathToFileURL("./scripts/"));
