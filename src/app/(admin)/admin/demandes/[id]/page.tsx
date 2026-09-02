import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequestActions } from "@/components/admin/request-actions";
import { Panel } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/auth";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { formatDateTime, statusStyles, urgencyStyles } from "@/lib/status";
import { store } from "@/lib/store";
import { whatsappHref } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const { id } = await params;
  const request = await store.getRequest(id);
  if (!request) notFound();

  const style = statusStyles[request.status];

  return (
    <AdminShell
      title={request.reference}
      subtitle={`${request.customer.name} · ${request.service.label}`}
      actions={
        <>
          <a
            href={`tel:${request.customer.phone}`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-volt-400 px-4 text-sm font-bold text-ink-950 transition hover:bg-volt-300"
          >
            <Icon name="phone" size={16} />
            Appeler
          </a>
          <Link
            href="/admin/demandes"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-mist-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-mist-50"
          >
            Retour
          </Link>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Demande">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${style.chip}`}
              >
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                {fr.client.statuses[request.status]}
              </span>
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${urgencyStyles[request.urgency]}`}
              >
                {fr.request.urgency[request.urgency]}
              </span>
              <span className="rounded-full border border-mist-200 bg-mist-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {request.source === "assistant" ? "Via l'assistant" : "Via le formulaire"}
              </span>
              <span className="rounded-full border border-mist-200 bg-mist-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {request.locale.toUpperCase()}
              </span>
            </div>

            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{request.description}</p>

            {request.photos.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-3">
                {request.photos.map((photo) => (
                  <li key={photo.id}>
                    <a href={`/api/media/${photo.id}`} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/media/${photo.id}`}
                        alt={photo.name}
                        className="h-28 w-28 rounded-xl border border-mist-200 object-cover transition hover:opacity-85"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel title="Client">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nom</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">{request.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Téléphone</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <a href={`tel:${request.customer.phone}`} className="font-semibold text-aqua-700 hover:underline">
                    {request.customer.phone}
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <Icon name="whatsapp" size={13} />
                    WhatsApp
                  </a>
                </dd>
              </div>
              {request.customer.email ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">E-mail</dt>
                  <dd className="mt-1 text-sm">
                    <a
                      href={`mailto:${request.customer.email}`}
                      className="font-semibold text-aqua-700 hover:underline"
                    >
                      {request.customer.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zone</dt>
                <dd className="mt-1 text-sm text-slate-700">{request.customer.area || "—"}</dd>
              </div>
              {request.customer.address ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Adresse</dt>
                  <dd className="mt-1 text-sm text-slate-700">{request.customer.address}</dd>
                </div>
              ) : null}
              {request.preferredDate || request.preferredTime ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Souhait du client</dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {[request.preferredDate, request.preferredTime].filter(Boolean).join(" · ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          <Panel title="Historique">
            <ol className="space-y-4">
              {[...request.timeline].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusStyles[entry.status].dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{fr.client.statuses[entry.status]}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                    {entry.note ? <p className="mt-1 text-sm text-slate-600">{entry.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div>
          <RequestActions request={request} />
        </div>
      </div>
    </AdminShell>
  );
}
