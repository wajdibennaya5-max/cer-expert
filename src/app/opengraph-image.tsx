import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * Image de partage (Open Graph / réseaux sociaux), générée à la construction.
 *
 * Dessinée en HTML/CSS puis rasterisée par Next : aucune image externe, aucune
 * licence à vérifier. Elle est volontairement identique pour les trois langues —
 * elle porte la marque, le métier et le numéro, c'est-à-dire ce qui compte
 * quand un lien est partagé dans une conversation.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = site.name;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #04070f 0%, #0c1424 55%, #113047 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* Le logo est redessiné en SVG : le moteur de rendu d'image ne dispose
              pas de police emoji, un caractère ⚡ y resterait invisible. */}
        <svg width="84" height="84" viewBox="0 0 48 48">
          <rect x="0" y="0" width="48" height="48" rx="14" fill="#0c1c30" />
          <path
            d="M24 9c6.6 7.6 10 12.2 10 16.8A10 10 0 0 1 24 36a10 10 0 0 1-10-10.2C14 21.2 17.4 16.6 24 9Z"
            fill="#3fd0ef"
          />
          <path d="M25.6 15.5 19 25.4h4.4L22.6 33l7-10.4h-4.6l.6-7.1Z" fill="#fbbf24" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>WAJDI &amp; TAYSSIR</span>
          <span style={{ fontSize: 21, color: "#67e2f9", letterSpacing: 5 }}>SERVICES PRO</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, maxWidth: 980, letterSpacing: -2 }}>
          Plomberie &amp; Électricité
        </span>
        <span style={{ fontSize: 44, fontWeight: 700, color: "#fbbf24" }}>Dépannage à domicile</span>
        <span style={{ fontSize: 28, color: "#94a3b8", marginTop: 8 }}>
          Une intervention rapide, fiable et professionnelle.
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 24, color: "#64748b" }}>Rapidité. Qualité. Confiance.</span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#04070f",
            background: "linear-gradient(90deg, #fcd34d, #f59e0b)",
            padding: "18px 34px",
            borderRadius: 999,
          }}
        >
          {site.phone.display}
        </span>
      </div>
    </div>,
    size,
  );
}
