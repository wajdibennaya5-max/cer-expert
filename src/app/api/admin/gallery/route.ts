import { fail, invalid, logError, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { galleryItemSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  return ok({ items: await store.listGallery() });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await readJson(request);
  if (body === null) return fail("Requête illisible");
  const parsed = galleryItemSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await store.listGallery();
    const item = await store.createGalleryItem({
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      category: parsed.data.category,
      kind: parsed.data.kind,
      mediaId: parsed.data.mediaId || undefined,
      beforeMediaId: parsed.data.beforeMediaId || undefined,
      illustration: parsed.data.illustration || undefined,
      published: parsed.data.published ?? true,
      order: parsed.data.order ?? existing.length,
    });
    return ok({ item }, { status: 201 });
  } catch (error) {
    logError("admin.gallery.create", error);
    return serverError();
  }
}
