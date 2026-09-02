import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { getAdminSession } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const items = await store.listGallery();

  return (
    <AdminShell title="Galerie" subtitle="Photos de chantier et illustrations publiées sur le site">
      <GalleryManager items={items} />
    </AdminShell>
  );
}
