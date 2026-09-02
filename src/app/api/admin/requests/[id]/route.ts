import { fail, invalid, logError, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { syncClientProfile } from "@/lib/rewards";
import { store } from "@/lib/store";
import { appointmentSchema, statusUpdateSchema } from "@/lib/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: statusUpdateSchema.optional(),
  appointment: appointmentSchema.optional(),
  note: z.string().trim().min(1).max(500).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const found = await store.getRequest(id);
  return found ? ok({ request: found }) : notFound();
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;

  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    let current = await store.getRequest(id);
    if (!current) return notFound();

    if (parsed.data.appointment) {
      current = await store.updateRequest(id, {
        appointment: {
          date: parsed.data.appointment.date,
          time: parsed.data.appointment.time,
          technician: parsed.data.appointment.technician || undefined,
        },
      });
    }
    if (parsed.data.note) {
      current = await store.addRequestNote(id, parsed.data.note);
    }
    if (parsed.data.status) {
      current = await store.setRequestStatus(id, parsed.data.status.status, parsed.data.status.note || undefined);
      // Le statut « terminé » alimente les points de fidélité du client.
      if (current) await syncClientProfile(current);
    }

    return current ? ok({ request: current }) : notFound();
  } catch (error) {
    logError("admin.requests.patch", error);
    return serverError();
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const removed = await store.deleteRequest(id);
  return removed ? ok({ deleted: true }) : notFound();
}
