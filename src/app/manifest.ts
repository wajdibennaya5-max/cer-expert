import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Permet l'ajout du site à l'écran d'accueil sur Android et iOS. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.tagline,
    start_url: "/fr",
    display: "standalone",
    background_color: "#04070f",
    theme_color: "#04070f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
