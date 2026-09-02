import { fail, invalid, logError, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "published", "rejected"]).optional(),
  reply: z.string().trim().max(500).optional().or(z.literal("")),
  comment: z.string().trim().min(5).max(1000).optional(),
  name: z.string().trim().min(2).max(60).optional(),
  isSample: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const updated = await store.updateReview(id, parsed.data);
    return updated ? ok({ review: updated }) : notFound();
  } catch (error) {
    logError("admin.reviews.patch", error);
    return serverError();
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const removed = await store.deleteReview(id);
  return removed ? ok({ deleted: true }) : notFound();
}
