import { ok } from "@/lib/api";
import { endClientSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await endClientSession();
  return ok({ authenticated: false });
}
