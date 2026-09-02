"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

/**
 * Page 404 localisée.
 * La langue est déduite de l'URL : un visiteur arabophone qui atterrit sur une
 * adresse morte reste dans sa langue et garde le bouton d'appel sous la main.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "";
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="section-dark relative flex min-h-[70vh] items-center overflow-hidden py-24">
      <div className="aurora" aria-hidden="true" />
      <div className="tech-grid" aria-hidden="true" />
      <div className="container-page relative text-center">
        <p className="font-display text-[6rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:2px_rgba(34,204,238,0.6)] sm:text-[9rem]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">{dict.common.error}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{dict.contact.subtitle}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={localePath(locale)} className={button("primary", "lg")}>
            <Icon name="home" size={18} />
            {dict.nav.home}
          </Link>
          <Link href={localePath(locale, "services")} className={button("outline", "lg")}>
            {dict.nav.services}
          </Link>
          <a href={telHref} className={button("volt", "lg")}>
            <Icon name="phone" size={18} />
            <PhoneText />
          </a>
        </div>
      </div>
    </section>
  );
}
