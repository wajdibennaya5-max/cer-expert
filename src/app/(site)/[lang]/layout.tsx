import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cairo, Inter, Sora } from "next/font/google";
import "@/app/globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileActionBar } from "@/components/site/mobile-action-bar";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { WelcomeBonus } from "@/components/site/welcome-bonus";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { store } from "@/lib/store";

/** Les trois langues sont pré-générées au build : aucune page n'est calculée à la demande. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** Les contenus modifiables depuis l'administration sont rafraîchis chaque minute. */
export const revalidate = 60;

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap", preload: false });

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.home.title, template: `%s — ${site.shortName}` },
    description: dict.meta.home.description,
    applicationName: site.name,
    authors: [{ name: site.name }],
    generator: "Next.js",
    keywords: [
      "plombier",
      "électricien",
      "dépannage",
      "plomberie Tunisie",
      "électricité Tunis",
      "fuite d'eau",
      "panne électrique",
      "chauffe-eau",
      "débouchage",
      "tableau électrique",
    ],
    alternates: {
      canonical: `${site.url}/${locale}`,
      languages: Object.fromEntries(locales.map((item) => [localeMeta[item].htmlLang, `${site.url}/${item}`])),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: dict.meta.home.title,
      description: dict.meta.home.description,
      url: `${site.url}/${locale}`,
      locale: localeMeta[locale].htmlLang.replace("-", "_"),
      // Vignette de partage générée par `src/app/image-partage/route.tsx`.
      // Elle est déclarée explicitement : le site utilisant deux mises en page
      // racines (public et administration), la convention de fichier de Next ne
      // la rattache pas automatiquement aux pages publiques.
      images: [{ url: "/image-partage", width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.home.title,
      description: dict.meta.home.description,
      images: ["/image-partage"],
    },
    robots: { index: true, follow: true },
    // Preuve de propriété pour Google Search Console. Search Console est
    // indépendante de la fiche Google Business Profile : elle continue de
    // référencer le site même sans fiche, ce qui en fait le canal de secours
    // quand la fiche est indisponible.
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
    formatDetection: { telephone: true },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const settings = await store.getSettings();
  const meta = localeMeta[locale];

  return (
    <html lang={meta.htmlLang} dir={meta.dir} className={`${sora.variable} ${inter.variable} ${cairo.variable}`}>
      <body className="bg-ink-950 antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:font-semibold focus:text-ink-900"
        >
          {dict.common.skipToContent}
        </a>

        <Header
          locale={locale}
          dict={dict}
          announcement={
            settings.announcement.enabled && settings.announcement.text ? (
              <AnnouncementBar text={settings.announcement.text} />
            ) : null
          }
        />

        <main id="contenu" className="pb-safe-bar min-h-screen bg-mist-50">
          {children}
        </main>

        <Footer locale={locale} dict={dict} areas={settings.areas} />
        <MobileActionBar locale={locale} dict={dict} />
        <AssistantWidget locale={locale} dict={dict} />
        {settings.rewards.enabled && settings.rewards.welcomeEnabled ? (
          <WelcomeBonus
            locale={locale}
            dict={dict}
            title={settings.rewards.welcomeTitle}
            text={settings.rewards.welcomeText}
          />
        ) : null}

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(locale, settings.areas)) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(locale)) }}
        />
      </body>
    </html>
  );
}
