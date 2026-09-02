import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "@/app/globals.css";
import { site } from "@/lib/site";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Administration — ${site.shortName}`, template: `%s — Administration` },
  description: "Console de gestion des demandes d'intervention.",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Mise en page racine de la console.
 * Volontairement séparée du site public : la console ne charge ni l'assistant,
 * ni la barre d'action mobile, ni les polices arabes.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${sora.variable} ${inter.variable}`}>
      <body className="bg-mist-100 antialiased">{children}</body>
    </html>
  );
}
