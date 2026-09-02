import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/auth";
import { statusStyles } from "@/lib/status";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1 + delta, 1);
  return monthKey(date);
}

/**
 * Vue calendrier des rendez-vous.
 * Rendue entièrement côté serveur : la navigation entre les mois passe par
 * l'URL (`?m=2026-09`), donc elle fonctionne sans JavaScript et reste partageable.
 */
export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  if (!(await getAdminSession())) redirect("/admin/login");

  const { m } = await searchParams;
  const today = new Date();
  const current = /^\d{4}-\d{2}$/.test(m ?? "") ? (m as string) : monthKey(today);
  const [year, month] = current.split("-").map(Number);

  const requests = await store.listRequests();
  const scheduled = requests.filter((request) => request.appointment);

  const firstDay = new Date(year!, month! - 1, 1);
  const daysInMonth = new Date(year!, month!, 0).getDate();
  // Lundi = 0 : la semaine commence le lundi, comme en Tunisie et en France.
  const offset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <AdminShell
      title="Calendrier"
      subtitle={`${scheduled.length} rendez-vous programmé${scheduled.length > 1 ? "s" : ""} au total`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendrier?m=${shiftMonth(current, -1)}`}
            aria-label="Mois précédent"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-mist-200 bg-white text-slate-600 transition hover:bg-mist-50"
          >
            <Icon name="chevronRight" size={17} className="rotate-180" />
          </Link>
          <span className="min-w-40 text-center text-sm font-bold capitalize text-ink-900">{monthLabel}</span>
          <Link
            href={`/admin/calendrier?m=${shiftMonth(current, 1)}`}
            aria-label="Mois suivant"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-mist-200 bg-white text-slate-600 transition hover:bg-mist-50"
          >
            <Icon name="chevronRight" size={17} />
          </Link>
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-card">
        <div className="grid grid-cols-7 border-b border-mist-200 bg-mist-50">
          {weekdays.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const dayKey = day ? `${current}-${String(day).padStart(2, "0")}` : "";
            const entries = day ? scheduled.filter((request) => request.appointment?.date === dayKey) : [];
            const isToday = dayKey === todayKey;

            return (
              <div
                key={index}
                className={`min-h-28 border-b border-e border-mist-100 p-2 ${day ? "" : "bg-mist-50/60"} ${
                  isToday ? "bg-aqua-50/60" : ""
                }`}
              >
                {day ? (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isToday ? "bg-aqua-500 text-white" : "text-slate-500"
                      }`}
                    >
                      {day}
                    </span>
                    <ul className="mt-1 space-y-1">
                      {entries.map((request) => (
                        <li key={request.id}>
                          <Link
                            href={`/admin/demandes/${request.id}`}
                            className={`block truncate rounded-lg border px-2 py-1 text-[0.65rem] font-semibold transition hover:opacity-80 ${statusStyles[request.status].chip}`}
                            title={`${request.appointment?.time} — ${request.customer.name}`}
                          >
                            {request.appointment?.time} {request.customer.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Les rendez-vous se programment depuis la fiche d&apos;une demande (Demandes → une demande → Rendez-vous).
      </p>
    </AdminShell>
  );
}
