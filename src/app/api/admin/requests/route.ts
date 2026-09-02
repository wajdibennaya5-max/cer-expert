import { logError, ok, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import type { RequestFilter } from "@/lib/store/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const url = new URL(request.url);
    const filter: RequestFilter = {
      status: (url.searchParams.get("status") as RequestFilter["status"]) ?? "all",
      category: (url.searchParams.get("category") as RequestFilter["category"]) ?? "all",
      urgency: (url.searchParams.get("urgency") as RequestFilter["urgency"]) ?? "all",
      search: url.searchParams.get("search") ?? "",
    };
    return ok({ requests: await store.listRequests(filter) });
  } catch (error) {
    logError("admin.requests.list", error);
    return serverError();
  }
}
