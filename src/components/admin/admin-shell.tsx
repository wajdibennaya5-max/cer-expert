import Link from "next/link";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import { AdminNav } from "./admin-nav";
import { AdminLogout } from "./admin-logout";
import { isAdminConfigured, isSessionSecretConfigured } from "@/lib/auth";
import { site } from "@/lib/site";

export const adminLinks = [
  { href: "/admin", label: "Tableau de bord", icon: "chart" },
  { href: "/admin/demandes", label: "Demandes", icon: "wrench" },
  { href: "/admin/calendrier", label: "Calendrier", icon: "calendar" },
  { href: "/admin/galerie", label: "Galerie", icon: "camera" },
  { href: "/admin/avis", label: "Avis", icon: "star" },
  { href: "/admin/parametres", label: "Paramètres", icon: "spark" },
];

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const needsSetup = !isAdminConfigured() || !isSessionSecretConfigured();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-ink-800 bg-ink-950 lg:flex">
        <div className="flex items-center gap-3 border-b border-ink-800 px-5 py-5">
          <Logo className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold text-white">WAJDI &amp; TAYSSIR</p>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-aqua-300">Administration</p>
          </div>
        </div>
        <AdminNav links={adminLinks} />
        <div className="border-t border-ink-800 p-4">
          <Link
            href="/fr"
            className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/6 hover:text-white"
          >
            <Icon name="home" size={17} />
            Voir le site
          </Link>
          <AdminLogout />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-mist-200 bg-white/90 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-extrabold text-ink-900 sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
          <div className="lg:hidden">
            <AdminNav links={adminLinks} horizontal />
          </div>
        </header>

        {needsSetup ? (
          <div className="mx-5 mt-5 rounded-2xl border border-volt-300 bg-volt-50 px-5 py-4 text-sm text-volt-900 sm:mx-8">
            <p className="flex items-start gap-2.5 font-semibold">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              Configuration à finaliser avant la mise en ligne
            </p>
            <p className="mt-1.5 ps-7 text-xs leading-relaxed">
              {!isAdminConfigured()
                ? "Aucun identifiant d'administration n'est défini : le compte de développement admin / admin est actif. "
                : ""}
              {!isSessionSecretConfigured() ? "La variable SESSION_SECRET n'est pas définie. " : ""}
              Renseignez ces variables d&apos;environnement (voir README.md § Sécurité) avant d&apos;ouvrir le site au
              public.
            </p>
          </div>
        ) : null}

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>

        <footer className="border-t border-mist-200 px-5 py-4 text-xs text-slate-400 sm:px-8">
          {site.name} · Console d&apos;administration
        </footer>
      </div>
    </div>
  );
}
