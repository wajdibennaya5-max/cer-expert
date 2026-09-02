import Link from "next/link";
import { Icon } from "@/components/icons";
import { Logo } from "./logo";
import { services } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { mailHref, site, telHref, whatsappHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

export function Footer({ locale, dict, areas }: { locale: Locale; dict: Dictionary; areas: string[] }) {
  const year = new Date().getFullYear();
  const highlighted = services.slice(0, 6);

  return (
    <footer className="section-dark relative overflow-hidden border-t border-white/8">
      <div className="tech-grid opacity-40" aria-hidden="true" />
      <div className="container-page relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div>
                <p className="font-display text-lg font-extrabold leading-tight text-white">WAJDI &amp; TAYSSIR</p>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">Services Pro</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-volt-300">{site.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{dict.footer.about}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-aqua-200">
              <Icon name="spark" size={14} />
              {dict.footer.slogan}
            </p>
          </div>

          <nav className="lg:col-span-2" aria-label={dict.footer.navigation}>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">{dict.footer.navigation}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              {[
                { href: localePath(locale), label: dict.nav.home },
                { href: localePath(locale, "services"), label: dict.nav.services },
                { href: localePath(locale, "realisations"), label: dict.nav.gallery },
                { href: localePath(locale, "avis"), label: dict.nav.reviews },
                { href: localePath(locale, "demande"), label: dict.nav.request },
                { href: localePath(locale, "espace-client"), label: dict.nav.clientArea },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-aqua-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-3" aria-label={dict.footer.services}>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">{dict.footer.services}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              {highlighted.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={localePath(locale, `services/${service.slug}`)}
                    className="transition hover:text-aqua-300"
                  >
                    {service.name[locale]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={localePath(locale, "services")}
                  className="font-semibold text-aqua-300 transition hover:text-aqua-200"
                >
                  {dict.cta.seeAll} →
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">{dict.footer.contact}</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a href={telHref} className="group flex items-center gap-3 transition hover:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt-400/15 text-volt-300">
                    <Icon name="phone" size={16} />
                  </span>
                  <span className="font-semibold text-white group-hover:text-volt-300">
                    <PhoneText />
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <Icon name="whatsapp" size={16} />
                  </span>
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={mailHref} className="group flex items-center gap-3 break-all transition hover:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aqua-400/15 text-aqua-300">
                    <Icon name="mail" size={16} />
                  </span>
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-3 pt-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/6 text-slate-300">
                  <Icon name="clock" size={16} />
                </span>
                <span>
                  {dict.contact.weekdays} · {site.hours.weekdays}
                  <br />
                  {dict.contact.saturday} · {site.hours.saturday}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {areas.length > 0 ? (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/8 pt-8">
            <span className="me-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {dict.contact.areasTitle}
            </span>
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-300"
              >
                {area}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-4 border-t border-white/8 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={localePath(locale, "confidentialite")} className="transition hover:text-slate-300">
              {dict.footer.privacy}
            </Link>
            <Link href={localePath(locale, "conditions")} className="transition hover:text-slate-300">
              {dict.footer.terms}
            </Link>
            <Link href="/admin" className="transition hover:text-slate-300">
              {dict.footer.adminLink}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
