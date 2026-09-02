import Link from "next/link";
import { Icon } from "@/components/icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** En-tête des pages intérieures : même bandeau sombre partout, fil d'Ariane inclus. */
export function PageHeader({
  locale,
  dict,
  title,
  subtitle,
  eyebrow,
  breadcrumb = [],
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="section-dark relative overflow-hidden pt-32 pb-14 sm:pt-40 sm:pb-16">
      <div className="aurora opacity-70" aria-hidden="true" />
      <div className="tech-grid" aria-hidden="true" />
      <div className="container-page relative">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Link href={localePath(locale)} className="transition hover:text-aqua-300">
            {dict.nav.home}
          </Link>
          {breadcrumb.map((entry) => (
            <span key={entry.label} className="flex items-center gap-2">
              <Icon name="chevronRight" size={12} className="opacity-50 rtl:rotate-180" />
              {entry.href ? (
                <Link href={entry.href} className="transition hover:text-aqua-300">
                  {entry.label}
                </Link>
              ) : (
                <span className="text-slate-300">{entry.label}</span>
              )}
            </span>
          ))}
        </nav>

        {eyebrow ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-aqua-200">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-300">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
