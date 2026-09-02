"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import { button } from "@/components/ui/button";

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "locked">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      if (response.status === 429) {
        setStatus("locked");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-2xl border border-white/12 bg-ink-900 px-4 py-3.5 text-[0.95rem] text-white shadow-sm transition placeholder:text-slate-500 focus:border-aqua-400 focus:outline-none";

  return (
    <div className="section-dark flex min-h-screen items-center justify-center px-5 py-16">
      <div className="aurora opacity-70" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="gradient-border rounded-3xl bg-ink-900/85 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div>
              <p className="font-display text-base font-extrabold text-white">WAJDI &amp; TAYSSIR</p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-aqua-300">Administration</p>
            </div>
          </div>

          <label htmlFor="username" className="mt-8 mb-1.5 block text-sm font-semibold text-slate-200">
            Identifiant
          </label>
          <input id="username" name="username" required autoComplete="username" className={field} />

          <label htmlFor="password" className="mt-4 mb-1.5 block text-sm font-semibold text-slate-200">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />

          {status === "error" ? (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <Icon name="alert" size={16} />
              Identifiants incorrects.
            </p>
          ) : null}
          {status === "locked" ? (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-2xl border border-volt-400/30 bg-volt-400/10 px-4 py-3 text-sm text-volt-200"
            >
              <Icon name="alert" size={16} />
              Trop de tentatives. Patientez quelques minutes.
            </p>
          ) : null}

          <button type="submit" disabled={status === "sending"} className={button("primary", "lg", "mt-6 w-full")}>
            {status === "sending" ? "Connexion…" : "Se connecter"}
          </button>

          {!configured ? (
            <p className="mt-5 rounded-2xl border border-volt-400/25 bg-volt-400/8 px-4 py-3 text-xs leading-relaxed text-volt-200">
              Aucun identifiant n&apos;est configuré : le compte de développement
              <strong> admin / admin </strong> est actif. Définissez ADMIN_USERNAME et ADMIN_PASSWORD_HASH avant la
              mise en ligne (voir README.md).
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
