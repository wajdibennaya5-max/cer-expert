import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { AdminShell } from "@/components/admin/admin-shell";
import { DayChart, Panel, StatCard } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/auth";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { buildStats } from "@/lib/stats";
import { formatDate, statusStyles, urgencyStyles } from "@/lib/status";
import { store } from "@/lib/store";
import { requestStatuses } from "@/lib/store/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!(await getAdminSession())) redirect("/admin/login");

  const [requests, clients, reviews, settings] = await Promise.all([
    store.listRequests(),
    store.listClients(),
    store.listReviews(),
    store.getSettings(),
  ]);
  const stats = buildStats(requests, clients, reviews);
  const urgent = requests
    .filter(
      (request) => request.urgency === "emergency" && request.status !== "done" && request.status !== "cancelled",
    )
    .slice(0, 5);
  const recent = requests.slice(0, 6);

  return (
    <AdminShell
      title="Tableau de bord"
      subtitle={`${stats.total} demande${stats.total > 1 ? "s" : ""} enregistrée${stats.total > 1 ? "s" : ""}`}
      actions={
        <Link
          href="/admin/demandes"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Icon name="wrench" size={16} />
          Gérer les demandes
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nouvelles demandes"
          value={stats.byStatus.received}
          icon="plus"
          accent="aqua"
          hint={`${stats.today} aujourd'hui`}
        />
        <StatCard
          label="Urgences en cours"
          value={stats.urgent}
          icon="alert"
          accent="red"
          hint="À traiter en priorité"
        />
        <StatCard label="Rendez-vous à venir" value={stats.upcoming.length} icon="calendar" accent="volt" />
        <StatCard
          label="Clients"
          value={stats.clients}
          icon="user"
          accent="emerald"
          hint={`${stats.week} demandes cette semaine`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Demandes des 14 derniers jours" className="lg:col-span-2" fill>
          <DayChart data={stats.last14Days} />
        </Panel>

        <Panel title="Répartition par statut">
          <ul className="space-y-3">
            {requestStatuses.map((status) => {
              const count = stats.byStatus[status];
              const share = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <li key={status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[status].dot}`} />
                      {fr.client.statuses[status]}
                    </span>
                    <span className="font-bold text-ink-900">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist-100">
                    <div
                      className={`h-full rounded-full ${statusStyles[status].bar}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Services les plus demandés">
          {stats.topServices.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topServices.map((service) => (
                <li key={service.slug} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-600">{service.label}</span>
                  <span className="shrink-0 rounded-full bg-mist-100 px-2.5 py-1 text-xs font-bold text-ink-900">
                    {service.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Urgences" className="lg:col-span-2">
          {urgent.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune urgence en attente.</p>
          ) : (
            <ul className="space-y-2.5">
              {urgent.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/admin/demandes/${request.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 transition hover:bg-red-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink-900">
                        {request.reference} · {request.customer.name}
                      </span>
                      <span className="block truncate text-xs text-slate-600">{request.service.label}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-red-700">
                      {formatDate(request.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Dernières demandes"
          action={
            <Link href="/admin/demandes" className="text-xs font-bold text-aqua-700 hover:text-aqua-800">
              Tout voir
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune demande enregistrée.</p>
          ) : (
            <ul className="divide-y divide-mist-100">
              {recent.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/admin/demandes/${request.id}`}
                    className="flex items-center gap-3 py-3 transition hover:opacity-75"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusStyles[request.status].dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {request.customer.name} — {request.service.label}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {request.reference} · {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold ${urgencyStyles[request.urgency]}`}
                    >
                      {fr.request.urgency[request.urgency]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Prochains rendez-vous"
          action={
            <Link href="/admin/calendrier" className="text-xs font-bold text-aqua-700 hover:text-aqua-800">
              Calendrier
            </Link>
          }
        >
          {stats.upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun rendez-vous programmé.</p>
          ) : (
            <ul className="divide-y divide-mist-100">
              {stats.upcoming.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/admin/demandes/${entry.id}`}
                    className="flex items-center gap-3 py-3 transition hover:opacity-75"
                  >
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-mist-100 text-ink-900">
                      <span className="text-sm font-extrabold leading-none">{entry.date.slice(8)}</span>
                      <span className="text-[0.6rem] uppercase text-slate-500">{entry.date.slice(5, 7)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">{entry.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {entry.reference} · {entry.time}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {stats.pendingReviews > 0 ? (
        <Link
          href="/admin/avis"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-volt-300 bg-volt-50 px-5 py-4 text-sm font-semibold text-volt-900 transition hover:bg-volt-100"
        >
          <Icon name="star" size={18} />
          {stats.pendingReviews} avis en attente de modération
        </Link>
      ) : null}

      {!settings.rewards.enabled ? (
        <p className="mt-5 rounded-2xl border border-mist-200 bg-white px-5 py-4 text-sm text-slate-500">
          Le programme de fidélité est désactivé — activez-le dans les paramètres pour l&apos;afficher sur le site.
        </p>
      ) : null}
    </AdminShell>
  );
}
