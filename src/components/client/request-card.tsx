import { Icon } from "@/components/icons";
import { getService } from "@/content/services";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatDate, formatDateTime, progressIndex, progressSteps, statusStyles, urgencyStyles } from "@/lib/status";
import type { InterventionRequest } from "@/lib/store/types";

/** Carte de suivi d'une demande, telle que la voit le client. */
export function ClientRequestCard({
  request,
  locale,
  dict,
}: {
  request: InterventionRequest;
  locale: Locale;
  dict: Dictionary;
}) {
  const service = getService(request.service.slug);
  const style = statusStyles[request.status];
  const current = progressIndex(request.status);
  const cancelled = request.status === "cancelled";

  return (
    <article className="overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-mist-100 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{dict.client.reference}</p>
          <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink-900">{request.reference}</p>
          <p className="mt-1 text-xs text-slate-500">
            {dict.client.submitted} {formatDate(request.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${style.chip}`}
        >
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {dict.client.statuses[request.status]}
        </span>
      </header>

      <div className="space-y-5 p-6">
        {!cancelled ? (
          <div>
            <div className="flex items-center gap-1.5">
              {progressSteps.map((step, index) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= current ? statusStyles[step].bar : "bg-mist-200"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-2">
              {progressSteps.map((step, index) => (
                <span
                  key={step}
                  className={`hidden text-[0.62rem] font-medium sm:block ${
                    index <= current ? "text-ink-900" : "text-slate-400"
                  }`}
                >
                  {dict.client.statuses[step]}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{dict.client.service}</dt>
            <dd className="mt-1 text-sm font-semibold text-ink-900">
              {service ? service.name[locale] : request.service.label}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{dict.client.urgency}</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${urgencyStyles[request.urgency]}`}
              >
                {dict.request.urgency[request.urgency]}
              </span>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {dict.client.appointment}
            </dt>
            <dd className="mt-1 flex items-center gap-2 text-sm text-ink-900">
              <Icon name="calendar" size={15} className="text-slate-400" />
              {request.appointment ? (
                `${formatDate(request.appointment.date)} · ${request.appointment.time}${
                  request.appointment.technician ? ` · ${request.appointment.technician}` : ""
                }`
              ) : (
                <span className="text-slate-500">{dict.client.noAppointment}</span>
              )}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{dict.client.description}</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{request.description}</p>
        </div>

        {request.photos.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{dict.client.photos}</p>
            <ul className="mt-2 flex flex-wrap gap-2.5">
              {request.photos.map((photo) => (
                <li key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${photo.id}`}
                    alt={photo.name}
                    loading="lazy"
                    className="h-20 w-20 rounded-2xl border border-mist-200 object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <details className="rounded-2xl border border-mist-200 bg-mist-50 px-4">
          <summary className="cursor-pointer list-none py-3.5 text-sm font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
            {dict.client.timeline} ({request.timeline.length})
          </summary>
          <ol className="space-y-3 pb-4 ps-1">
            {[...request.timeline].reverse().map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusStyles[entry.status].dot}`} />
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    {dict.client.statuses[entry.status]}
                  </span>
                  <span className="block text-xs text-slate-500">{formatDateTime(entry.at)}</span>
                  {entry.note ? <span className="mt-0.5 block text-xs text-slate-600">{entry.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </article>
  );
}
