import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * LE QR DE PAIEMENT — servi depuis le disque, jamais depuis le dépôt.
 *
 * POURQUOI PAS DANS `public/`. Un QR de portefeuille identifie un compte
 * personnel. Déposé dans le dépôt, il entre dans l'historique Git et n'en sort
 * plus jamais, y compris si le dépôt devient public un jour. Il vit donc dans
 * `DATA_DIR`, qui est exclu du dépôt par construction — le même endroit que
 * les photos des clients, et pour la même raison.
 *
 * POURQUOI UNE ROUTE PLUTÔT QU'UN FICHIER STATIQUE. Parce qu'une route peut
 * refuser. Le chemin ne vient jamais de la requête : un seul fichier est
 * servi, celui que l'environnement désigne. Aucune traversée de répertoire
 * n'est possible, puisqu'il n'y a rien à traverser.
 */

/**
 * Le dossier où déposer le QR. Voisin des autres données, hors du dépôt.
 *
 * Lu à l'appel et non au chargement du module : une constante figée au premier
 * `import` prend la valeur qu'avait l'environnement à cet instant. Sur un
 * serveur qui charge sa configuration après le code, cela donne un chemin
 * calculé avant que `DATA_DIR` existe — et un QR introuvable sans raison
 * apparente.
 */
export const dossierQr = (): string =>
  path.join(
    process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data"),
    "paiement",
  );

/** Un QR reste petit. Au-delà, ce n'est pas un QR, c'est une photo. */
export const TAILLE_MAX = 2 * 1024 * 1024;

/** Les signatures binaires acceptées — le nom de fichier ne prouve rien. */
const SIGNATURES: Array<{ mime: string; octets: number[] }> = [
  { mime: "image/png", octets: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", octets: [0xff, 0xd8, 0xff] },
  { mime: "image/webp", octets: [0x52, 0x49, 0x46, 0x46] },
];

function typeReel(octets: Buffer): string | null {
  for (const { mime, octets: signature } of SIGNATURES) {
    if (signature.every((octet, i) => octets[i] === octet)) {
      // WebP : « RIFF » ne suffit pas, on confirme « WEBP ».
      if (mime === "image/webp" && octets.subarray(8, 12).toString("latin1") !== "WEBP") continue;
      return mime;
    }
  }
  return null;
}

/** Le nom du fichier attendu, ou `null` si aucun QR n'est configuré. */
export function nomFichierQr(): string | null {
  const brut = process.env.PAIEMENT_FLOUCI_QR?.trim();
  if (!brut) return null;
  // Un nom, pas un chemin. Même venant de l'environnement, on ne laisse pas
  // une valeur mal recopiée pointer ailleurs sur le disque.
  const nom = path.basename(brut);
  return nom && nom !== "." && nom !== ".." ? nom : null;
}

/** Le QR est-il configuré ? (Sans lire le disque.) */
export const qrConfigure = (): boolean => nomFichierQr() !== null;

/**
 * Lit le QR.
 *
 * @returns le fichier et son type réel, ou la raison de l'échec — jamais
 *   d'exception : un QR absent ne doit pas casser la page de paiement, qui
 *   affiche alors le numéro à saisir à la main.
 */
export async function lireQr():
Promise<{ ok: true; octets: Buffer; mime: string } | { ok: false; raison: string }> {
  const nom = nomFichierQr();
  if (!nom) return { ok: false, raison: "Aucun QR configuré (PAIEMENT_FLOUCI_QR)." };

  const dossier = dossierQr();
  const chemin = path.join(dossier, nom);
  // Ceinture et bretelles : après `basename`, le chemin ne peut plus sortir du
  // dossier. On le vérifie quand même — c'est une ligne, et le jour où
  // quelqu'un « simplifiera » le `basename`, ce contrôle tiendra encore.
  if (path.dirname(path.resolve(chemin)) !== path.resolve(dossier)) {
    return { ok: false, raison: "Chemin de QR refusé." };
  }

  let taille: number;
  try {
    const infos = await stat(chemin);
    if (!infos.isFile()) return { ok: false, raison: "Le QR configuré n’est pas un fichier." };
    taille = infos.size;
  } catch {
    return { ok: false, raison: `Fichier introuvable : ${path.join("data/paiement", nom)}` };
  }
  if (taille <= 0 || taille > TAILLE_MAX) {
    return { ok: false, raison: `Taille inattendue pour un QR (${taille} octets).` };
  }

  const octets = await readFile(chemin);
  const mime = typeReel(octets);
  if (!mime) {
    // Un fichier renommé en `.png` n'est pas une image. Servir son contenu
    // avec un type d'image serait au mieux inutile, au pire dangereux.
    return { ok: false, raison: "Le fichier n’est pas une image reconnue." };
  }
  return { ok: true, octets, mime };
}
