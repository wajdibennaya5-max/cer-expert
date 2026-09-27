import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PhoneText } from "@/components/ui/phone-text";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaBand } from "@/components/home/cta-band";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, locales, type Locale } from "@/lib/i18n/config";
import { breadcrumbJsonLd, localizedMetadata } from "@/lib/seo";
import { contactEmails, site, telHref } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return localizedMetadata({
    locale: isLocale(lang) ? lang : "fr",
    path: "a-propos",
    title: dict.meta.about.title,
    description: dict.meta.about.description,
  });
}

/** Une icône par valeur, dans l'ordre du dictionnaire. */
const valueIcons = ["eye", "check", "spark", "chart"];

/**
 * À propos.
 *
 * Tout ce qui figure ici est vérifiable sur le site lui-même : les métiers,
 * le secteur, les horaires, le suivi par référence, l'espace client. Aucune
 * date de création, aucun effectif, aucune année d'expérience — rien de tout
 * cela n'a été fourni, et rien n'est inventé pour remplir la page.
 */
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  const identity = [
    { label: dict.about.identity.company, value: site.name },
    { label: dict.about.identity.trades, value: dict.about.tradesValue },
    { label: dict.about.identity.area, value: dict.pro.area },
  ];

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.about.eyebrow}
        title={dict.about.title}
        subtitle={dict.about.subtitle}
        breadcrumb={[{ label: dict.nav.about }]}
      />

      <Section>
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <h2 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
              {dict.about.storyTitle}
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {dict.about.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-5">
            <aside className="gradient-border relative overflow-hidden rounded-3xl bg-ink-900 p-7 text-white shadow-card">
              <div className="aurora opacity-40" aria-hidden="true" />
              <div className="relative">
                <h2 className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-aqua-200">
                  <Icon name="badge" size={16} />
                  {dict.about.identityTitle}
                </h2>
                <dl className="mt-6 space-y-4 text-sm">
                  {identity.map((row) => (
                    <div key={row.label} className="border-b border-white/8 pb-4">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{row.label}</dt>
                      <dd className="mt-1 font-semibold text-white">{row.value}</dd>
                    </div>
                  ))}
                  <div className="border-b border-white/8 pb-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {dict.about.identity.hours}
                    </dt>
                    <dd className="mt-1 font-semibold text-white">
                      {dict.contact.weekdays} · <bdi dir="ltr">{site.hours.weekdays}</bdi>
                      <br />
                      {dict.contact.saturday} · <bdi dir="ltr">{site.hours.saturday}</bdi>
                    </dd>
                  </div>
                  <div className="border-b border-white/8 pb-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {dict.about.identity.phone}
                    </dt>
                    <dd className="mt-1">
                      <a href={telHref} className="font-semibold text-volt-300 hover:text-volt-200">
                        <PhoneText />
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {dict.about.identity.email}
                    </dt>
                    {contactEmails.map((email) => (
                      <dd key={email} className="mt-1">
                        <a
                          href={`mailto:${email}`}
                          className="break-all font-semibold text-aqua-200 hover:text-white"
                        >
                          {email}
                        </a>
                      </dd>
                    ))}
                  </div>
                </dl>
              </div>
            </aside>
          </Reveal>
        </div>
      </Section>

      <Section tone="mist">
        <div className="container-page">
          <SectionHeading eyebrow={dict.about.eyebrow} title={dict.about.valuesTitle} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dict.about.values.map((value, index) => (
              <Reveal key={value.title} delay={index * 70} className="h-full">
                <div className="lift group h-full rounded-3xl border border-mist-200 bg-white p-6 shadow-card transition hover:shadow-card-hover">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 text-aqua-300 transition-transform duration-500 group-hover:scale-110">
                    <Icon name={valueIcons[index] ?? "check"} size={22} />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-ink-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <HowItWorks dict={dict} />

      <Section compact>
        <div className="container-page">
          <Reveal>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-mist-200 bg-mist-50 px-6 py-10 text-center sm:px-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-aqua-700 shadow-card">
                <Icon name="heart" size={22} />
              </span>
              <h2 className="text-2xl font-extrabold text-ink-900">{dict.about.honestyTitle}</h2>
              <p className="text-pretty text-base leading-relaxed text-slate-600">{dict.about.honesty}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: dict.nav.home, url: `${site.url}${localePath(locale)}` },
              { name: dict.nav.about, url: `${site.url}${localePath(locale, "a-propos")}` },
            ]),
          ),
        }}
      />
    </>
  );
}
