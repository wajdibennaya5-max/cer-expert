"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { statusStyles } from "@/lib/status";
import type { InterventionRequest, RequestStatus } from "@/lib/store/types";
import { requestStatuses } from "@/lib/store/types";

/** Actions de traitement d'une demande : statut, rendez-vous, note interne. */
export function RequestActions({ request }: { request: InterventionRequest }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [statusNote, setStatusNote] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("patch");
      router.refresh();
    } catch {
      setError("La mise à jour a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-aqua-400 focus:outline-none";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Statut</h2>
        <div className="mt-4 grid gap-2">
          {requestStatuses.map((status: RequestStatus) => {
            const active = request.status === status;
            return (
              <button
                key={status}
                type="button"
                disabled={busy || active}
                onClick={() => void patch({ status: { status, note: statusNote } })}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? `${statusStyles[status].chip} cursor-default`
                    : "border-mist-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-mist-50"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[status].dot}`} />
                {fr.client.statuses[status]}
                {active ? <Icon name="check" size={15} className="ms-auto" /> : null}
              </button>
            );
          })}
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">
            Commentaire joint au changement de statut
          </span>
          <input
            value={statusNote}
            onChange={(event) => setStatusNote(event.target.value)}
            maxLength={500}
            placeholder="Visible par le client dans son suivi"
            className={field}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Rendez-vous</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void patch({
              appointment: {
                date: String(form.get("date") ?? ""),
                time: String(form.get("time") ?? ""),
                technician: String(form.get("technician") ?? ""),
              },
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Date</span>
              <input
                name="date"
                type="date"
                required
                defaultValue={request.appointment?.date ?? ""}
                className={field}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Heure</span>
              <input
                name="time"
                type="time"
                required
                defaultValue={request.appointment?.time ?? ""}
                className={field}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Technicien</span>
            <input
              name="technician"
              maxLength={80}
              defaultValue={request.appointment?.technician ?? ""}
              className={field}
            />
          </label>
          <button type="submit" disabled={busy} className={button("primary", "md", "w-full")}>
            <Icon name="calendar" size={16} />
            {request.appointment ? "Mettre à jour le rendez-vous" : "Programmer le rendez-vous"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Note interne</h2>
        <p className="mt-1 text-xs text-slate-400">Visible uniquement dans cette console.</p>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            void patch({ note: note.trim() }).then(() => setNote(""));
          }}
        >
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            className={`${field} resize-y`}
            placeholder="Pièce à prévoir, remarque sur l'accès, suite à donner…"
          />
          <button
            type="submit"
            disabled={busy || !note.trim()}
            className={button("light", "md", "w-full border border-mist-200")}
          >
            <Icon name="plus" size={16} />
            Ajouter la note
          </button>
        </form>

        {request.adminNotes.length > 0 ? (
          <ul className="mt-4 space-y-2.5 border-t border-mist-100 pt-4">
            {[...request.adminNotes].reverse().map((entry) => (
              <li key={entry.at} className="rounded-xl bg-mist-50 p-3 text-sm text-slate-700">
                <p className="whitespace-pre-line">{entry.text}</p>
                <p className="mt-1 text-[0.65rem] text-slate-400">{new Date(entry.at).toLocaleString("fr-FR")}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
