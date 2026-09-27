import Link from "next/link";
import { Icon } from "@/components/icons";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PhoneText } from "@/components/ui/phone-text";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { contactEmails, site, telHref, whatsappHref } from "@/lib/site";

/**
 * Infos pratiques — la fiche qu'on consulte juste avant d'appeler.
 *
 * Horaires, secteur, moyens de contact, engagements : quatre cartes, et rien
 * qui ne soit déjà vrai ailleurs sur le site. Les engagements reprennent mot
 * pour mot la réassurance affichée sous les boutons de l'accueil.
 */
export function PracticalInfo({ locale, dict, areas }: { locale: Locale; dict: Dictionary; areas: string[] }) {
  const card = "h-full rounded-3xl border border-mist-200 bg-white p-6 shadow-card";
  const title = "flex items-center gap-2.5 text-base font-bold text-ink-900";
  const puce = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl";

  return (
    <Section tone="mist" id="infos">
      <div className="container-page">
        <SectionHeading
          eyebrow={dict.pro.infos.eyebrow}
          title={dict.pro.infos.title}
          subtitle={dict.pro.infos.subtitle}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Reveal className="h-full">
            <div className={card}>
              <h3 className={title}>
                <span className={`${puce} bg-aqua-50 text-aqua-700`}>
                  <Icon name="clock" size={18} />
                </span>
                {dict.pro.infos.hoursTitle}
              </h3>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">{dict.contact.weekdays}</dt>
                  <dd className="font-semibold text-ink-900">
                    <bdi dir="ltr">{site.hours.weekdays}</bdi>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">{dict.contact.saturday}</dt>
                  <dd className="font-semibold text-ink-900">
                    <bdi dir="ltr">{site.hours.saturday}</bdi>
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-mist-100 pt-3">
                  <dt className="text-slate-600">{dict.contact.sunday}</dt>
                  <dd className="text-end font-semibold text-ink-900">{dict.contact.closed}</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={70} className="h-full">
            <div className={`${card} flex flex-col`}>
              <h3 className={title}>
                <span className={`${puce} bg-aqua-50 text-aqua-700`}>
                  <Icon name="pin" size={18} />
                </span>
                {dict.pro.infos.areaTitle}
              </h3>
              <p className="mt-4 text-sm font-semibold text-ink-900">{dict.pro.area}</p>
              <ul className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
                {areas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {area}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath(locale, "zone-intervention")}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-aqua-700 transition hover:text-aqua-800"
              >
                {dict.pro.infos.areaLink}
                <Icon name="arrowRight" size={15} className="rtl:rotate-180" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={140} className="h-full">
            <div className={card}>
              <h3 className={title}>
                <span className={`${puce} bg-volt-50 text-volt-700`}>
                  <Icon name="phone" size={18} />
                </span>
                {dict.pro.infos.contactTitle}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={telHref} className="flex items-center gap-2.5 font-bold text-ink-900 hover:text-aqua-700">
                    <Icon name="phone" size={16} className="shrink-0 text-slate-500" />
                    <PhoneText />
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 font-semibold text-ink-900 hover:text-emerald-700"
                  >
                    <Icon name="whatsapp" size={16} className="shrink-0 text-slate-500" />
                    {dict.cta.whatsapp}
                  </a>
                </li>
                {contactEmails.map((email) => (
                  <li key={email}>
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center gap-2.5 break-all font-semibold text-ink-900 hover:text-aqua-700"
                    >
                      <Icon name="mail" size={16} className="shrink-0 text-slate-500" />
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={210} className="h-full">
            <div className={card}>
              <h3 className={title}>
                <span className={`${puce} bg-emerald-50 text-emerald-700`}>
                  <Icon name="shield" size={18} />
                </span>
                {dict.pro.infos.commitmentsTitle}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {dict.reassurance.map((mention) => (
                  <li key={mention} className="flex items-start gap-2.5 text-slate-700">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {mention}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
