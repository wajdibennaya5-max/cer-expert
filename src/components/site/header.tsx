"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { contactEmails, mailHref, site, telHref, whatsappHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
  /** Bandeau d'annonce affiché à l'intérieur de l'en-tête fixe, au-dessus de la navigation. */
  announcement?: React.ReactNode;
}

export function Header({ locale, dict, announcement }: HeaderProps) {
  const pathname = usePathname() ?? "";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le menu mobile se referme à chaque navigation, et libère le défilement.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: localePath(locale), label: dict.nav.home },
    { href: localePath(locale, "services"), label: dict.nav.services },
    { href: localePath(locale, "realisations"), label: dict.nav.gallery },
    { href: localePath(locale, "avis"), label: dict.nav.reviews },
    { href: localePath(locale, "a-propos"), label: dict.nav.about },
    { href: localePath(locale, "zone-intervention"), label: dict.nav.zone },
    { href: localePath(locale, "contact"), label: dict.nav.contact },
  ];

  function isActive(href: string): boolean {
    if (href === localePath(locale)) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-ink-950/85 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        {announcement}

        {/*
          Barre d'informations, sur grand écran seulement.

          Elle répond aux questions qu'on se pose avant d'appeler un artisan —
          où intervient-il, à quelle heure, comment l'écrire — sans prendre de
          place à la navigation. Elle se replie dès qu'on fait défiler : à ce
          moment le visiteur lit la page, et chaque pixel de hauteur compte.
          `inert` la retire du parcours clavier une fois repliée.
        */}
        <div
          inert={scrolled}
          className={`hidden overflow-hidden transition-[max-height,opacity] duration-500 xl:block ${
            scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
          }`}
        >
          <div className="border-b border-white/8">
            <div className="container-page flex h-10 items-center justify-between gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <Icon name="pin" size={14} className="text-aqua-300" />
                  {dict.pro.area}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="clock" size={14} className="text-aqua-300" />
                  {dict.pro.weekdaysShort} <bdi dir="ltr">{site.hours.weekdays}</bdi>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  {dict.pro.saturdayShort} <bdi dir="ltr">{site.hours.saturday}</bdi>
                </span>
              </div>
              <div className="flex items-center gap-5">
                <a href={mailHref} className="flex items-center gap-1.5 transition hover:text-white">
                  <Icon name="mail" size={14} className="text-aqua-300" />
                  {site.email}
                </a>
                <Link
                  href={localePath(locale, "espace-client")}
                  className="flex items-center gap-1.5 transition hover:text-white"
                >
                  <Icon name="user" size={14} className="text-aqua-300" />
                  {dict.nav.clientArea}
                </Link>
                <LanguageSwitcher locale={locale} label={dict.nav.language} small />
              </div>
            </div>
          </div>
        </div>

        <div className="container-page flex h-18 items-center justify-between gap-4 py-3">
          <Link href={localePath(locale)} className="flex shrink-0 items-center gap-3" aria-label={site.name}>
            <Logo className="h-10 w-10 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.8rem] font-extrabold tracking-tight text-white sm:text-[0.95rem]">
                WAJDI &amp; TAYSSIR
              </span>
              <span className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-aqua-300 sm:text-[0.62rem]">
                Services Pro
              </span>
            </span>
          </Link>

          <nav aria-label={dict.nav.menu} className="hidden items-center xl:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-full px-3 py-2 text-[0.84rem] font-medium transition ${
                  isActive(link.href) ? "text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link.href) ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-aqua-400 to-volt-400" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block xl:hidden">
              <LanguageSwitcher locale={locale} label={dict.nav.language} />
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <a
                href={telHref}
                className={button("volt", "md")}
                data-cta="call-header"
                aria-label={`${dict.cta.call} ${site.phone.display}`}
              >
                <Icon name="phone" size={17} />
                <span className="hidden lg:inline">
                  <PhoneText />
                </span>
                <span className="lg:hidden">{dict.cta.call}</span>
              </a>
              <Link href={localePath(locale, "demande")} className={button("primary", "md")}>
                {dict.cta.request}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={dict.nav.menu}
              aria-expanded={menuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white xl:hidden"
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------- menu mobile */}
      {/*
        `inert` retire tout le sous-arbre de la navigation au clavier et de
        l'arbre d'accessibilité tant que le menu est fermé. Sans lui, un
        utilisateur au clavier traverse une dizaine de liens invisibles avant
        d'atteindre la page — et `aria-hidden` seul ne l'empêche pas, il ne fait
        que masquer aux lecteurs d'écran des éléments qui restent focalisables.
      */}
      <div className={`fixed inset-0 z-[60] xl:hidden ${menuOpen ? "" : "pointer-events-none"}`} inert={!menuOpen}>
        <div
          className={`absolute inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          aria-label={dict.nav.menu}
          className={`absolute inset-y-0 end-0 flex w-[min(22rem,88vw)] flex-col gap-1 overflow-y-auto bg-ink-900 p-6 shadow-2xl transition-transform duration-400 ${
            menuOpen ? "translate-x-0" : "rtl:-translate-x-full ltr:translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <Logo className="h-9 w-9" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={dict.nav.closeMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-2xl px-4 py-3 text-base font-semibold transition ${
                isActive(link.href) ? "bg-aqua-500/15 text-aqua-200" : "text-slate-200 hover:bg-white/6"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={localePath(locale, "espace-client")}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/6"
          >
            <Icon name="user" size={18} />
            {dict.nav.clientArea}
          </Link>

          <div className="mt-4 flex flex-col gap-3">
            <Link href={localePath(locale, "demande")} className={button("primary", "lg", "w-full")}>
              <Icon name="spark" size={18} />
              {dict.cta.request}
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={telHref} className={button("volt", "lg", "w-full")}>
                <Icon name="phone" size={18} />
                {dict.cta.call}
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={button("outline", "lg", "w-full")}
              >
                <Icon name="whatsapp" size={18} />
                {dict.cta.whatsapp}
              </a>
            </div>
          </div>

          <ul className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <Icon name="pin" size={16} className="shrink-0 text-aqua-300" />
              {dict.pro.area}
            </li>
            {contactEmails.map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="flex items-center gap-2.5 break-all hover:text-white">
                  <Icon name="mail" size={16} className="shrink-0 text-aqua-300" />
                  {email}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-white/10 pt-5">
            <LanguageSwitcher locale={locale} label={dict.nav.language} />
          </div>
        </nav>
      </div>
    </>
  );
}
