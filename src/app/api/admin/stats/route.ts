import { logError, ok, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { buildStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const [requests, clients, reviews] = await Promise.all([
      store.listRequests(),
      store.listClients(),
      store.listReviews(),
    ]);
    return ok({ stats: buildStats(requests, clients, reviews) });
  } catch (error) {
    logError("admin.stats", error);
    return serverError();
  }
}
