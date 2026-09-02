/**
 * Contrôle des fichiers envoyés par les visiteurs.
 *
 * Trois vérifications indépendantes : l'extension, le type MIME déclaré et la
 * signature binaire réelle du fichier. Un fichier renommé en `.jpg` ne passe
 * donc pas. Le nom d'origine n'est jamais utilisé comme nom sur disque.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const allowed: Record<string, { extension: string; magic: number[][] }> = {
  "image/jpeg": { extension: ".jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: ".png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/webp": { extension: ".webp", magic: [[0x52, 0x49, 0x46, 0x46]] },
};

export type MediaCheck =
  { ok: true; mime: string; extension: string } | { ok: false; reason: "type" | "size" | "content" };

export function checkUpload(mime: string, size: number, head: Uint8Array): MediaCheck {
  const spec = allowed[mime];
  if (!spec) return { ok: false, reason: "type" };
  if (size <= 0 || size > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };

  const matches = spec.magic.some((signature) => signature.every((byte, index) => head[index] === byte));
  if (!matches) return { ok: false, reason: "content" };

  // WebP : « RIFF » suffit pour les quatre premiers octets, on confirme « WEBP ».
  if (mime === "image/webp") {
    const tag = String.fromCharCode(head[8] ?? 0, head[9] ?? 0, head[10] ?? 0, head[11] ?? 0);
    if (tag !== "WEBP") return { ok: false, reason: "content" };
  }

  return { ok: true, mime, extension: spec.extension };
}

/** Nettoie le nom affiché (le nom sur disque, lui, est un identifiant généré). */
export function safeDisplayName(name: string): string {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || "photo";
}
