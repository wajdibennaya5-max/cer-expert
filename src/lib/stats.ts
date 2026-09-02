import { serviceName } from "@/content/services";
import type { ClientProfile, InterventionRequest, RequestStatus, Review } from "@/lib/store/types";

/**
 * Agrégats du tableau de bord.
 *
 * Tout est calculé à la volée à partir des demandes : aucun compteur dupliqué
 * à maintenir, donc aucune statistique qui peut « désynchroniser ».
 */

export interface DashboardStats {
  total: number;
  today: number;
  week: number;
  byStatus: Record<RequestStatus, number>;
  urgent: number;
  pendingReviews: number;
  clients: number;
  topServices: { slug: string; label: string; count: number }[];
  last14Days: { date: string; count: number }[];
  categorySplit: { plomberie: number; electricite: number; autre: number };
  upcoming: { id: string; reference: string; date: string; time: string; name: string }[];
}

function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function buildStats(
  requests: InterventionRequest[],
  clients: ClientProfile[],
  reviews: Review[],
): DashboardStats {
  const now = new Date();
  const todayKey = dayKey(now);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const byStatus: Record<RequestStatus, number> = {
    received: 0,
    analysis: 0,
    scheduled: 0,
    onsite: 0,
    done: 0,
    cancelled: 0,
  };
  const serviceCounts = new Map<string, number>();
  const categorySplit = { plomberie: 0, electricite: 0, autre: 0 };

  for (const request of requests) {
    byStatus[request.status] += 1;
    serviceCounts.set(request.service.slug, (serviceCounts.get(request.service.slug) ?? 0) + 1);
    if (request.service.category === "plomberie") categorySplit.plomberie += 1;
    else if (request.service.category === "electricite") categorySplit.electricite += 1;
    else categorySplit.autre += 1;
  }

  const last14Days: { date: string; count: number }[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(now.getTime() - offset * 24 * 3600 * 1000);
    const key = dayKey(day);
    last14Days.push({
      date: key,
      count: requests.filter((request) => dayKey(request.createdAt) === key).length,
    });
  }

  const upcoming = requests
    .filter((request) => request.appointment && request.status !== "done" && request.status !== "cancelled")
    .map((request) => ({
      id: request.id,
      reference: request.reference,
      date: request.appointment!.date,
      time: request.appointment!.time,
      name: request.customer.name,
    }))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  return {
    total: requests.length,
    today: requests.filter((request) => dayKey(request.createdAt) === todayKey).length,
    week: requests.filter((request) => request.createdAt >= weekAgo).length,
    byStatus,
    urgent: requests.filter(
      (request) => request.urgency === "emergency" && request.status !== "done" && request.status !== "cancelled",
    ).length,
    pendingReviews: reviews.filter((review) => review.status === "pending").length,
    clients: clients.length,
    topServices: [...serviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, count]) => ({ slug, label: serviceName(slug, "fr"), count })),
    last14Days,
    categorySplit,
    upcoming,
  };
}
