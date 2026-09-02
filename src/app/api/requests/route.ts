import { getService } from "@/content/services";
import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { startClientSession } from "@/lib/auth";
import { defaultLocale } from "@/lib/i18n/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { syncClientProfile } from "@/lib/rewards";
import { phoneKey, store } from "@/lib/store";
import { interventionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Création d'une demande d'intervention depuis le formulaire public. */
export async function POST(request: Request) {
  const limit = rateLimit(`requests:${clientIp(request)}`, 6, 10 * 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = interventionRequestSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const input = parsed.data;
  // Champ piège : rempli uniquement par un robot.
  if (input.company) return ok({ reference: "WT-0000-0000" });

  try {
    const service = getService(input.serviceSlug);
    const created = await store.createRequest({
      locale: input.locale ?? defaultLocale,
      source: input.source === "assistant" ? "assistant" : "form",
      customer: {
        name: input.name,
        phone: input.phone,
        phoneKey: phoneKey(input.phone),
        email: input.email || undefined,
        address: input.address || undefined,
        area: input.area || undefined,
      },
      service: {
        slug: service?.slug ?? "autre",
        category: service?.category ?? "autre",
        label: service?.name.fr ?? "Demande générale",
      },
      description: input.description,
      urgency: input.urgency,
      preferredDate: input.preferredDate || undefined,
      preferredTime: input.preferredTime || undefined,
      photos: input.photos ?? [],
    });

    const profile = await syncClientProfile(created);
    await startClientSession(profile.phoneKey, profile.name);

    return ok({ reference: created.reference, id: created.id }, { status: 201 });
  } catch (error) {
    logError("requests.create", error);
    return serverError();
  }
}
