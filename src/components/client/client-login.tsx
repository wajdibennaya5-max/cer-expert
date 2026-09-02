"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function ClientLogin({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: String(form.get("reference") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
        }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-2xl border border-mist-200 bg-white px-4 py-3.5 text-[0.95rem] text-ink-900 shadow-sm transition placeholder:text-slate-400 focus:border-aqua-400 focus:outline-none focus:ring-4 focus:ring-aqua-100";

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-mist-200 bg-white p-7 shadow-card sm:p-9">
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 text-white shadow-lg">
          <Icon name="user" size={25} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-ink-900">{dict.client.login.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{dict.client.login.text}</p>

        <label htmlFor="reference" className="mt-6 mb-1.5 block text-sm font-semibold text-ink-900">
          {dict.client.login.reference}
        </label>
        <input
          id="reference"
          name="reference"
          required
          placeholder={dict.client.login.referencePlaceholder}
          className={`${field} font-mono uppercase tracking-wider`}
        />

        <label htmlFor="phone" className="mt-4 mb-1.5 block text-sm font-semibold text-ink-900">
          {dict.client.login.phone}
        </label>
        <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={field} />

        {status === "error" ? (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <Icon name="alert" size={16} />
            {dict.client.login.error}
          </p>
        ) : null}

        <button type="submit" disabled={status === "sending"} className={button("primary", "lg", "mt-6 w-full")}>
          {status === "sending" ? dict.common.loading : dict.client.login.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {dict.client.login.noRequest}{" "}
        <Link href={localePath(locale, "demande")} className="font-bold text-aqua-700 hover:text-aqua-800">
          {dict.client.login.createRequest}
        </Link>
      </p>
    </div>
  );
}
