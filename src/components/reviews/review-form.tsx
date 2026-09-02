"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { services } from "@/content/services";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function ReviewForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      area: String(form.get("area") ?? ""),
      rating,
      comment: String(form.get("comment") ?? ""),
      serviceSlug: String(form.get("serviceSlug") ?? ""),
      company: String(form.get("company") ?? ""),
    };

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "error");
      }
      setStatus("sent");
      event.currentTarget.reset();
      setRating(5);
    } catch {
      setStatus("error");
      setMessage(dict.common.error);
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Icon name="check" size={28} />
        </span>
        <p className="mt-4 text-base font-bold text-emerald-900">{dict.reviews.thanks}</p>
      </div>
    );
  }

  const field =
    "w-full rounded-2xl border border-mist-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm transition placeholder:text-slate-400 focus:border-aqua-400 focus:outline-none focus:ring-4 focus:ring-aqua-100";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-900">{dict.reviews.form.name}</span>
          <input name="name" required minLength={2} maxLength={60} className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-900">
            {dict.reviews.form.area}{" "}
            <span className="font-normal text-slate-400">({dict.reviews.form.optional})</span>
          </span>
          <input name="area" maxLength={60} className={field} />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 block text-sm font-semibold text-ink-900">{dict.reviews.form.rating}</legend>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} / 5`}
              aria-pressed={rating === value}
              className="rounded-full p-1 transition hover:scale-110"
            >
              <Icon
                name="star"
                size={30}
                filled={value <= rating}
                className={value <= rating ? "text-volt-400" : "text-mist-300"}
              />
            </button>
          ))}
          <span className="ms-2 text-sm font-semibold text-slate-500">
            {rating} {dict.reviews.ratingSuffix}
          </span>
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-ink-900">
          {dict.reviews.form.service}{" "}
          <span className="font-normal text-slate-400">({dict.reviews.form.optional})</span>
        </span>
        <select name="serviceSlug" className={field} defaultValue="">
          <option value="">—</option>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name[locale]}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-ink-900">{dict.reviews.form.comment}</span>
        <textarea name="comment" required minLength={10} maxLength={1000} rows={4} className={`${field} resize-y`} />
      </label>

      {/* Champ piège anti-robot : invisible pour un humain, obligatoirement vide. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Société
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "error" ? (
        <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className={button("primary", "lg", "mt-6 w-full sm:w-auto")}
      >
        {status === "sending" ? dict.cta.sending : dict.reviews.form.submit}
      </button>
    </form>
  );
}
