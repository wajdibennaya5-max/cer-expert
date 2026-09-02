import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { startAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Fenêtre volontairement stricte : la console n'est utilisée que par l'équipe.
  const limit = rateLimit(`admin-login:${clientIp(request)}`, 6, 15 * 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (!verifyAdminCredentials(parsed.data.username, parsed.data.password)) {
      return fail("Identifiants incorrects", 401);
    }
    await startAdminSession(parsed.data.username);
    return ok({ authenticated: true });
  } catch (error) {
    logError("admin.login", error);
    return serverError();
  }
}
