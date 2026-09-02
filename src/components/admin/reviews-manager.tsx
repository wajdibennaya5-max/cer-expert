"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Stars } from "@/components/reviews/stars";
import { serviceName } from "@/content/services";
import { formatDate } from "@/lib/status";
import type { Review } from "@/lib/store/types";

/** Modération des avis : publier, masquer, répondre, supprimer. */
export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | Review["status"]>("all");
  const [replyFor, setReplyFor] = useState<string | null>(null);

  const visible = filter === "all" ? reviews : reviews.filter((review) => review.status === filter);
  const counts = {
    all: reviews.length,
    pending: reviews.filter((review) => review.status === "pending").length,
    published: reviews.filter((review) => review.status === "published").length,
    rejected: reviews.filter((review) => review.status === "rejected").length,
  };

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const labels: Record<"all" | Review["status"], string> = {
    all: "Tous",
    pending: "En attente",
    published: "Publiés",
    rejected: "Refusés",
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "published", "rejected"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === key
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-mist-200 bg-white text-slate-600 hover:bg-mist-50"
            }`}
          >
            {labels[key]}
            <span className={`ms-2 text-xs ${filter === key ? "text-white/60" : "text-slate-400"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-mist-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun avis dans cette catégorie.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {visible.map((review) => (
            <li key={review.id} className="rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    {review.name}
                    {review.isSample ? (
                      <span className="rounded-full bg-mist-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-slate-500">
                        Exemple
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[
                      review.area,
                      review.serviceSlug ? serviceName(review.serviceSlug, "fr") : "",
                      formatDate(review.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Stars rating={review.rating} />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>

              {review.reply ? (
                <p className="mt-3 rounded-xl bg-aqua-50 p-3 text-xs leading-relaxed text-aqua-900">
                  <span className="font-bold">Votre réponse : </span>
                  {review.reply}
                </p>
              ) : null}

              {replyFor === review.id ? (
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = String(new FormData(event.currentTarget).get("reply") ?? "");
                    void patch(review.id, { reply: value }).then(() => setReplyFor(null));
                  }}
                >
                  <input
                    name="reply"
                    defaultValue={review.reply ?? ""}
                    maxLength={500}
                    placeholder="Votre réponse publique…"
                    className="flex-1 rounded-xl border border-mist-200 px-3.5 py-2.5 text-sm focus:border-aqua-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Enregistrer
                  </button>
                </form>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(["published", "pending", "rejected"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy || review.status === status}
                    onClick={() => void patch(review.id, { status })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      review.status === status
                        ? status === "published"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        : "border-mist-200 bg-white text-slate-500 hover:bg-mist-50"
                    }`}
                  >
                    {labels[status]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReplyFor(replyFor === review.id ? null : review.id)}
                  className="rounded-full border border-mist-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-mist-50"
                >
                  <Icon name="edit" size={13} className="me-1 inline" />
                  Répondre
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(review.id)}
                  className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Icon name="trash" size={13} />
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
