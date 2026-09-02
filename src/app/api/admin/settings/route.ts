import { fail, invalid, logError, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const badgeSchema = z.object({
  key: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8),
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200),
  trigger: z.enum(["first_request", "requests", "completed", "points"]),
  threshold: z.coerce.number().int().min(0).max(10000),
});

const tierSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(60),
  minPoints: z.coerce.number().int().min(0).max(100000),
  perk: z.string().trim().max(200),
});

const settingsSchema = z.object({
  areas: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  announcement: z.object({ enabled: z.boolean(), text: z.string().trim().max(200) }).optional(),
  showSampleReviews: z.boolean().optional(),
  rewards: z
    .object({
      enabled: z.boolean(),
      welcomeEnabled: z.boolean(),
      welcomeTitle: z.string().trim().max(80),
      welcomeText: z.string().trim().max(300),
      pointsPerRequest: z.coerce.number().int().min(0).max(1000),
      pointsPerCompleted: z.coerce.number().int().min(0).max(1000),
      pointsPerReview: z.coerce.number().int().min(0).max(1000),
      badges: z.array(badgeSchema).max(12),
      tiers: z.array(tierSchema).max(8),
    })
    .optional(),
});

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  return ok({ settings: await store.getSettings() });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    return ok({ settings: await store.updateSettings(parsed.data) });
  } catch (error) {
    logError("admin.settings.update", error);
    return serverError();
  }
}
