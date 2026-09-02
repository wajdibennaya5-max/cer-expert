import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequestsTable } from "@/components/admin/requests-table";
import { getAdminSession } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const requests = await store.listRequests();

  return (
    <AdminShell title="Demandes" subtitle="Rechercher, filtrer et suivre chaque intervention">
      <RequestsTable requests={requests} />
    </AdminShell>
  );
}
