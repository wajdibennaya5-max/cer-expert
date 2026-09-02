import { fail, logError, ok, serverError, tooMany } from "@/lib/api";
import { checkUpload, MAX_UPLOAD_BYTES, safeDisplayName } from "@/lib/media";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Réception d'une photo jointe à une demande (formulaire ou assistant). */
export async function POST(request: Request) {
  const limit = rateLimit(`media:${clientIp(request)}`, 20, 10 * 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  try {
    const form = await request.formData();
    const file = form.get("file");
    const scope = form.get("scope") === "gallery" ? "gallery" : "request";
    if (!(file instanceof File)) return fail("Aucun fichier reçu");
    if (file.size > MAX_UPLOAD_BYTES) return fail("Fichier trop volumineux", 413);

    const bytes = Buffer.from(await file.arrayBuffer());
    const check = checkUpload(file.type, bytes.byteLength, bytes.subarray(0, 16));
    if (!check.ok) {
      return fail(check.reason === "size" ? "Fichier trop volumineux" : "Format d'image non accepté", 415);
    }

    const record = await store.saveMedia(
      { name: safeDisplayName(file.name), mime: check.mime, size: bytes.byteLength, scope },
      bytes,
      check.extension,
    );

    return ok({ id: record.id, name: record.name, mime: record.mime, size: record.size });
  } catch (error) {
    logError("media.upload", error);
    return serverError();
  }
}
