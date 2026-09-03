import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * 404 technique.
 *
 * Le site public a sa propre page 404 localisée (`(site)/[lang]/not-found.tsx`),
 * désormais atteinte pour toute adresse commençant par une langue grâce à la
 * route attrape-tout `[lang]/[...introuvable]`. Cette page-ci ne concerne plus
 * que les chemins techniques qui échappent au middleware (`/api/...`,
 * ressources internes) — des adresses qu'un visiteur ne rencontre pas.
 *
 * Le projet utilise plusieurs mises en page racines (site et administration) :
 * aucune ne l'enveloppe, elle doit donc fournir elle-même `<html>` et `<body>`.
 * Sans cela la page était servie sans langue déclarée, illisible pour un
 * lecteur d'écran comme pour un moteur.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "#04070f",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <p style={{ fontSize: "3rem", fontWeight: 800, margin: 0 }}>404</p>
          <p style={{ margin: 0, color: "#94a3b8" }}>Cette adresse n&apos;existe pas.</p>
          <Link
            href="/fr"
            style={{
              marginTop: "0.5rem",
              background: "#22ccee",
              color: "#04070f",
              fontWeight: 700,
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
