import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";
import { reviewSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dépôt d'un avis client. Publication soumise à modération. */
export async function POST(request: Request) {
  const limit = rateLimit(`reviews:${clientIp(request)}`, 3, 30 * 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.company) return ok({ received: true });

  try {
    await store.createReview({
      name: parsed.data.name,
      area: parsed.data.area || undefined,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      serviceSlug: parsed.data.serviceSlug || undefined,
      status: "pending",
      isSample: false,
    });
    return ok({ received: true }, { status: 201 });
  } catch (error) {
    logError("reviews.create", error);
    return serverError();
  }
}
