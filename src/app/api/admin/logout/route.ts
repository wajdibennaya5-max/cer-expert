import { ok } from "@/lib/api";
import { endAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await endAdminSession();
  return ok({ authenticated: false });
}
