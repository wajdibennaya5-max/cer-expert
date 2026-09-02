import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ClientLogin } from "@/components/client/client-login";
import { LogoutButton } from "@/components/client/logout-button";
import { ClientRequestCard } from "@/components/client/request-card";
import { RewardsPanel } from "@/components/client/rewards-panel";
import { button } from "@/components/ui/button";
import { getClientSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { store } from "@/lib/store";
import { site } from "@/lib/site";

/** L'espace client dépend de la session : jamais mis en cache. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: dict.meta.client.title,
    description: dict.meta.client.description,
    robots: { index: false, follow: true },
  };
}

export default async function ClientAreaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const session = await getClientSession();

  const [requests, profile, settings] = session
    ? await Promise.all([store.listRequestsForClient(session.sub), store.getClient(session.sub), store.getSettings()])
    : [[], undefined, await store.getSettings()];

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.nav.clientArea}
        title={session?.name ? `${dict.client.title} — ${session.name}` : dict.client.title}
        subtitle={dict.client.subtitle}
        breadcrumb={[{ label: dict.nav.clientArea }]}
      >
        {session ? (
          <div className="mt-7 flex flex-wrap gap-3">
            <LogoutButton label={dict.client.logout} />
            <Link href={localePath(locale, "demande")} className={button("primary", "md")}>
              <Icon name="plus" size={16} />
              {dict.cta.request}
            </Link>
          </div>
        ) : null}
      </PageHeader>

      <Section tone="mist">
        <div className="container-page">
          {!session ? (
            <ClientLogin locale={locale} dict={dict} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <h2 className="text-xl font-extrabold text-ink-900">{dict.client.requests}</h2>
                {requests.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-mist-300 bg-white p-10 text-center">
                    <p className="text-sm text-slate-500">{dict.client.empty}</p>
                    <Link href={localePath(locale, "demande")} className={button("primary", "md", "mt-5")}>
                      {dict.cta.request}
                    </Link>
                  </div>
                ) : (
                  requests.map((request) => (
                    <ClientRequestCard key={request.id} request={request} locale={locale} dict={dict} />
                  ))
                )}
              </div>
              <div className="lg:col-span-4">
                <RewardsPanel profile={profile} settings={settings} dict={dict} />
              </div>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
