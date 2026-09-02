import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSession } from "@/lib/auth";
import { providerKind } from "@/lib/ai/provider";
import { store } from "@/lib/store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const settings = await store.getSettings();
  const assistant = providerKind();

  return (
    <AdminShell title="Paramètres" subtitle="Contenus modifiables sans redéploiement du site">
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Téléphone</p>
          <p className="mt-1 text-sm font-bold text-ink-900">{site.phone.display}</p>
          <p className="mt-1 text-xs text-slate-400">Variable NEXT_PUBLIC_CONTACT_PHONE</p>
        </div>
        <div className="rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">E-mail</p>
          <p className="mt-1 break-all text-sm font-bold text-ink-900">{site.email}</p>
          <p className="mt-1 text-xs text-slate-400">Variable NEXT_PUBLIC_CONTACT_EMAIL</p>
        </div>
        <div className="rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assistant</p>
          <p className="mt-1 text-sm font-bold text-ink-900">
            {assistant === "anthropic" ? "Modèle de langage connecté" : "Moteur de réponses guidées"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Variable ASSISTANT_PROVIDER</p>
        </div>
      </div>

      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
