import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { button } from "@/components/ui/button";
import { AssistantTrigger } from "@/components/assistant/assistant-button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, locales, type Locale } from "@/lib/i18n/config";
import { mailHref, site, telHref, whatsappHref } from "@/lib/site";
import { store } from "@/lib/store";
import { PhoneText } from "@/components/ui/phone-text";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return {
    title: dict.meta.contact.title,
    description: dict.meta.contact.description,
    alternates: {
      canonical: `${site.url}/${lang}/contact`,
      languages: Object.fromEntries(locales.map((item) => [item, `${site.url}/${item}/contact`])),
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const settings = await store.getSettings();

  const channels = [
    {
      key: "phone",
      icon: "phone",
      title: dict.contact.phoneTitle,
      text: dict.contact.phoneText,
      value: site.phone.display,
      href: telHref,
      external: false,
      accent: "from-volt-300 to-volt-500",
    },
    {
      key: "whatsapp",
      icon: "whatsapp",
      title: dict.contact.whatsappTitle,
      text: dict.contact.whatsappText,
      value: site.phone.display,
      href: whatsappHref,
      external: true,
      accent: "from-emerald-400 to-emerald-600",
    },
    {
      key: "email",
      icon: "mail",
      title: dict.contact.emailTitle,
      text: dict.contact.emailText,
      value: site.email,
      href: mailHref,
      external: false,
      accent: "from-aqua-400 to-aqua-600",
    },
  ];

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.contact}
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
        breadcrumb={[{ label: dict.nav.contact }]}
      />

      <Section tone="mist">
        <div className="container-page">
          <div className="grid gap-5 md:grid-cols-3">
            {channels.map((channel, index) => (
              <Reveal key={channel.key} delay={index * 80} className="h-full">
                <a
                  href={channel.href}
                  {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="lift group flex h-full flex-col rounded-3xl border border-mist-200 bg-white p-7 shadow-card transition hover:shadow-card-hover"
                >
                  <span
                    className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${channel.accent} text-white shadow-lg transition-transform duration-500 group-hover:scale-110`}
                  >
                    <Icon name={channel.icon} size={25} />
                  </span>
                  <h2 className="mt-5 text-lg font-bold text-ink-900">{channel.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{channel.text}</p>
                  <span className="mt-4 break-all text-sm font-bold text-aqua-700 group-hover:text-aqua-800">
                    {channel.key === "email" ? channel.value : <PhoneText value={channel.value} />}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-gradient-to-br from-ink-900 to-ink-950 p-8 text-white shadow-card">
                <div>
                  <h2 className="text-xl font-extrabold">{dict.contact.formTitle}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">{dict.contact.formText}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={localePath(locale, "demande")} className={button("primary", "lg", "w-full sm:w-auto")}>
                    <Icon name="spark" size={18} />
                    {dict.cta.request}
                  </Link>
                  <AssistantTrigger className={button("outline", "lg", "w-full sm:w-auto")}>
                    <Icon name="send" size={17} />
                    {dict.cta.assistant}
                  </AssistantTrigger>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="h-full rounded-3xl border border-mist-200 bg-white p-7 shadow-card">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-ink-900">
                  <Icon name="clock" size={19} className="text-aqua-600" />
                  {dict.contact.hoursTitle}
                </h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">{dict.contact.weekdays}</dt>
                    <dd className="font-semibold text-ink-900">{site.hours.weekdays}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">{dict.contact.saturday}</dt>
                    <dd className="font-semibold text-ink-900">{site.hours.saturday}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">{dict.contact.sunday}</dt>
                    <dd className="font-semibold text-ink-900">{dict.contact.closed}</dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-6">
            <div className="rounded-3xl border border-mist-200 bg-white p-7 shadow-card">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-ink-900">
                <Icon name="home" size={19} className="text-aqua-600" />
                {dict.contact.areasTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{dict.contact.areasText}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {settings.areas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full border border-mist-200 bg-mist-50 px-3.5 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
