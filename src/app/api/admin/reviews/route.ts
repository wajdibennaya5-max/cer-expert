import { logError, ok, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  try {
    return ok({ reviews: await store.listReviews() });
  } catch (error) {
    logError("admin.reviews.list", error);
    return serverError();
  }
}
