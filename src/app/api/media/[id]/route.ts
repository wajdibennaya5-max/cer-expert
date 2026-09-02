import { store } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Sert un média téléversé.
 *
 * Les fichiers sont volontairement stockés hors du dossier `public` et servis
 * par cette route : le nom sur disque reste un identifiant généré, et la
 * réponse porte des en-têtes explicites (type, cache, pas d'exécution).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{10,40}$/i.test(id)) return new Response("Introuvable", { status: 404 });

  const record = await store.getMedia(id);
  const bytes = record ? await store.readMediaBytes(id) : undefined;
  if (!record || !bytes) return new Response("Introuvable", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": record.mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${record.id}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
