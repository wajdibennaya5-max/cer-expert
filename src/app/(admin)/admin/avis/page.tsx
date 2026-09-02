import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { getAdminSession } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const reviews = await store.listReviews();
  const pending = reviews.filter((review) => review.status === "pending").length;

  return (
    <AdminShell
      title="Avis clients"
      subtitle={pending > 0 ? `${pending} avis en attente de modération` : "Tous les avis sont traités"}
    >
      <ReviewsManager reviews={reviews} />
    </AdminShell>
  );
}
