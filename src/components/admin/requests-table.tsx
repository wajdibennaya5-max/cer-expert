"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { formatDate, statusStyles, urgencyStyles } from "@/lib/status";
import type { InterventionRequest, RequestStatus, UrgencyLevel } from "@/lib/store/types";
import { requestStatuses, urgencyLevels } from "@/lib/store/types";

/**
 * Liste des demandes.
 *
 * Le filtrage se fait dans le navigateur sur les données déjà chargées : pour
 * le volume d'une entreprise artisanale, c'est instantané et cela évite un
 * aller-retour réseau à chaque frappe dans le champ de recherche.
 */
export function RequestsTable({ requests }: { requests: InterventionRequest[] }) {
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [urgency, setUrgency] = useState<UrgencyLevel | "all">("all");
  const [category, setCategory] = useState<"all" | "plomberie" | "electricite">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (status !== "all" && request.status !== status) return false;
      if (urgency !== "all" && request.urgency !== urgency) return false;
      if (category !== "all" && request.service.category !== category) return false;
      if (!needle) return true;
      return [
        request.reference,
        request.customer.name,
        request.customer.phone,
        request.customer.area ?? "",
        request.customer.address ?? "",
        request.service.label,
        request.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [category, requests, search, status, urgency]);

  const select =
    "h-10 rounded-xl border border-mist-200 bg-white px-3 text-sm font-medium text-ink-900 focus:border-aqua-400 focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
        <label className="relative flex-1 basis-64">
          <span className="sr-only">Rechercher</span>
          <Icon name="search" size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Référence, nom, téléphone, zone…"
            className="h-10 w-full rounded-xl border border-mist-200 bg-white ps-9 pe-3 text-sm text-ink-900 placeholder:text-slate-400 focus:border-aqua-400 focus:outline-none"
          />
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as RequestStatus | "all")}
          className={select}
        >
          <option value="all">Tous les statuts</option>
          {requestStatuses.map((value) => (
            <option key={value} value={value}>
              {fr.client.statuses[value]}
            </option>
          ))}
        </select>

        <select
          value={urgency}
          onChange={(event) => setUrgency(event.target.value as UrgencyLevel | "all")}
          className={select}
        >
          <option value="all">Toutes urgences</option>
          {urgencyLevels.map((value) => (
            <option key={value} value={value}>
              {fr.request.urgency[value]}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | "plomberie" | "electricite")}
          className={select}
        >
          <option value="all">Tous les métiers</option>
          <option value="plomberie">Plomberie</option>
          <option value="electricite">Électricité</option>
        </select>

        <span className="ms-auto rounded-full bg-mist-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          {filtered.length} / {requests.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-mist-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucune demande ne correspond à ces critères.
        </p>
      ) : (
        <>
          {/* Tableau sur grand écran */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-card lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-200 bg-mist-50 text-start text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-start">Référence</th>
                  <th className="px-5 py-3 text-start">Client</th>
                  <th className="px-5 py-3 text-start">Prestation</th>
                  <th className="px-5 py-3 text-start">Urgence</th>
                  <th className="px-5 py-3 text-start">Statut</th>
                  <th className="px-5 py-3 text-start">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100">
                {filtered.map((request) => (
                  <tr key={request.id} className="transition hover:bg-mist-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/demandes/${request.id}`}
                        className="font-mono text-xs font-bold text-aqua-700 hover:underline"
                      >
                        {request.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-ink-900">{request.customer.name}</span>
                      <a
                        href={`tel:${request.customer.phone}`}
                        className="block text-xs text-slate-500 hover:text-aqua-700"
                      >
                        {request.customer.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block text-slate-700">{request.service.label}</span>
                      {request.customer.area ? (
                        <span className="block text-xs text-slate-400">{request.customer.area}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[0.65rem] font-bold ${urgencyStyles[request.urgency]}`}
                      >
                        {fr.request.urgency[request.urgency]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold ${statusStyles[request.status].chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[request.status].dot}`} />
                        {fr.client.statuses[request.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(request.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes sur mobile */}
          <ul className="mt-5 space-y-3 lg:hidden">
            {filtered.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/admin/demandes/${request.id}`}
                  className="block rounded-2xl border border-mist-200 bg-white p-4 shadow-card transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-aqua-700">{request.reference}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${statusStyles[request.status].chip}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[request.status].dot}`} />
                      {fr.client.statuses[request.status]}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-ink-900">{request.customer.name}</p>
                  <p className="text-sm text-slate-600">{request.service.label}</p>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${urgencyStyles[request.urgency]}`}
                    >
                      {fr.request.urgency[request.urgency]}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(request.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
