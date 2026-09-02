import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { startClientSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { phoneKey, store } from "@/lib/store";
import { trackRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accès à l'espace client : référence + téléphone.
 *
 * Pas de mot de passe à retenir pour le client. La sécurité repose sur la
 * combinaison des deux éléments, une limitation stricte des tentatives, et un
 * message d'erreur unique qui n'indique pas lequel des deux est faux.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`client-login:${clientIp(request)}`, 8, 15 * 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = trackRequestSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const found = await store.getRequestByReference(parsed.data.reference);
    const key = phoneKey(parsed.data.phone);
    if (!found || found.customer.phoneKey !== key) {
      return fail("Référence ou téléphone incorrect", 401);
    }
    await startClientSession(key, found.customer.name);
    return ok({ authenticated: true });
  } catch (error) {
    logError("client.login", error);
    return serverError();
  }
}
