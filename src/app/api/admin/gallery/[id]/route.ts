import { fail, invalid, logError, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { galleryItemSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");

  const parsed = galleryItemSchema.partial().safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const updated = await store.updateGalleryItem(id, parsed.data);
    return updated ? ok({ item: updated }) : notFound();
  } catch (error) {
    logError("admin.gallery.patch", error);
    return serverError();
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await context.params;
  const item = (await store.listGallery()).find((entry) => entry.id === id);
  const removed = await store.deleteGalleryItem(id);
  // Les médias associés sont supprimés avec l'élément : pas de fichier orphelin.
  if (removed && item?.mediaId) await store.deleteMedia(item.mediaId);
  if (removed && item?.beforeMediaId) await store.deleteMedia(item.beforeMediaId);
  return removed ? ok({ deleted: true }) : notFound();
}
