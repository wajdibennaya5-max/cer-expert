import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { respond } from "@/lib/ai/engine";
import { enhanceTurn } from "@/lib/ai/provider";
import { startClientSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { defaultLocale } from "@/lib/i18n/config";
import { assistantMessageSchema } from "@/lib/validation";
import { getService } from "@/content/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Un tour de conversation de l'assistant.
 * La logique vit intégralement côté serveur : le navigateur ne reçoit que la
 * réponse à afficher et l'état à renvoyer au tour suivant.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`assistant:${clientIp(request)}`, 60, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = assistantMessageSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const { message, state, photos, locale } = parsed.data;

  try {
    const turn = await respond({
      message,
      state: state as never,
      photos,
      locale: locale ?? defaultLocale,
    });

    // Ouvre la session d'espace client dès qu'une demande vient d'être créée.
    const created = turn.created;
    if (created) {
      await startClientSession(created.phoneKey, created.name);
    }

    const enhanced = await enhanceTurn(turn, {
      userMessage: message,
      locale: locale ?? defaultLocale,
      serviceLabel: turn.state.data?.serviceSlug
        ? getService(turn.state.data.serviceSlug)?.name[locale ?? defaultLocale]
        : undefined,
    });

    // `created` contient une clé interne : elle ne quitte jamais le serveur.
    const { created: _internal, ...payload } = enhanced;
    void _internal;
    return ok(payload);
  } catch (error) {
    logError("assistant", error);
    return serverError();
  }
}
