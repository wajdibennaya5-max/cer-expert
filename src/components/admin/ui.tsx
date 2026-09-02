import { Icon } from "@/components/icons";

export function StatCard({
  label,
  value,
  icon,
  accent = "aqua",
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: "aqua" | "volt" | "emerald" | "red" | "slate";
  hint?: string;
}) {
  const accents = {
    aqua: "from-aqua-400 to-aqua-600",
    volt: "from-volt-300 to-volt-500",
    emerald: "from-emerald-400 to-emerald-600",
    red: "from-red-400 to-red-600",
    slate: "from-slate-400 to-slate-600",
  } as const;

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-ink-900">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} text-white`}
        >
          <Icon name={icon} size={21} />
        </span>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
  fill = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Le contenu occupe toute la hauteur disponible (utile pour un graphique). */
  fill?: boolean;
}) {
  return (
    <section className={`flex flex-col rounded-2xl border border-mist-200 bg-white shadow-card ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-mist-100 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h2>
        {action}
      </header>
      <div className={fill ? "flex flex-1 flex-col p-5" : "p-5"}>{children}</div>
    </section>
  );
}

/** Histogramme des 14 derniers jours, dessiné sans librairie de graphiques. */
export function DayChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((entry) => entry.count));
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-36 flex-1 items-stretch gap-1.5">
        {data.map((entry) => {
          const height = Math.round((entry.count / max) * 100);
          return (
            <div key={entry.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="pointer-events-none absolute -top-7 rounded-lg bg-ink-900 px-2 py-1 text-[0.65rem] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {entry.count}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-aqua-600 to-aqua-300 transition-all"
                style={{ height: `${Math.max(4, height)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[0.65rem] text-slate-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
