import type { Gouvernorat } from "@/lib/zones";

/**
 * Schéma du Grand Tunis.
 *
 * Un schéma, pas une carte : les positions respectent l'orientation réelle
 * (l'Ariana au nord, La Manouba à l'ouest, Ben Arous au sud-est, Tunis au
 * bord du lac et du golfe), sans prétendre aux frontières exactes. La légende
 * le dit. Aucun fond de carte externe : rien à télécharger, rien à autoriser.
 *
 * Le SVG reste en `ltr` quelle que soit la langue : on ne retourne pas la
 * géographie pour une page en arabe.
 */
const positions: Record<Gouvernorat, { x: number; y: number; r: number }> = {
  ariana: { x: 205, y: 80, r: 40 },
  tunis: { x: 240, y: 172, r: 38 },
  manouba: { x: 102, y: 170, r: 42 },
  benArous: { x: 218, y: 266, r: 40 },
};

export function GrandTunisMap({
  covered,
  labels,
  title,
}: {
  covered: Set<Gouvernorat>;
  labels: Record<Gouvernorat, string>;
  title: string;
}) {
  const cles = Object.keys(positions) as Gouvernorat[];
  const liste = cles.filter((cle) => covered.has(cle)).map((cle) => labels[cle]);

  return (
    <div dir="ltr">
      <svg viewBox="0 0 400 330" role="img" aria-label={`${title} : ${liste.join(", ")}`} className="h-auto w-full">
        <defs>
          <linearGradient id="gt-mer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cff9fe" />
            <stop offset="1" stopColor="#a5f0fc" />
          </linearGradient>
          <radialGradient id="gt-actif" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#22ccee" />
            <stop offset="1" stopColor="#0888ad" />
          </radialGradient>
          <pattern id="gt-points" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill="#cbd5e1" />
          </pattern>
        </defs>

        {/* Terre et golfe */}
        <rect width="400" height="330" rx="28" fill="url(#gt-points)" />
        <path
          d="M318 0 C300 60 336 96 312 140 C296 170 330 206 322 250 C316 286 344 312 356 330 L400 330 L400 0 Z"
          fill="url(#gt-mer)"
        />
        <path
          d="M318 0 C300 60 336 96 312 140 C296 170 330 206 322 250 C316 286 344 312 356 330"
          fill="none"
          stroke="#67e2f9"
          strokeWidth="1.5"
        />
        {/* Lac de Tunis */}
        <ellipse cx="300" cy="176" rx="17" ry="12" fill="url(#gt-mer)" stroke="#67e2f9" strokeWidth="1.2" />

        {/* Périmètre du Grand Tunis */}
        <path
          d="M70 110 C90 40 170 28 250 42 C300 52 318 110 312 160 C308 220 300 300 226 314 C150 326 76 290 58 220 C48 176 58 140 70 110 Z"
          fill="none"
          stroke="#0e6c8c"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />

        {/* Première passe : les cercles. */}
        {cles.map((cle) => {
          const { x, y, r } = positions[cle];
          const actif = covered.has(cle);
          return (
            <g key={`cercle-${cle}`}>
              {actif ? <circle cx={x} cy={y} r={r + 9} fill="#22ccee" fillOpacity="0.14" /> : null}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={actif ? "url(#gt-actif)" : "#f1f5f9"}
                stroke={actif ? "#ffffff" : "#cbd5e1"}
                strokeWidth={actif ? 3 : 1.5}
                strokeDasharray={actif ? undefined : "4 5"}
              />
              {actif ? (
                <>
                  <path
                    d={`M${x} ${y + 2} c-6-7-9.5-11-9.5-15.5a9.5 9.5 0 0 1 19 0c0 4.5-3.5 8.5-9.5 15.5Z`}
                    fill="#ffffff"
                  />
                  <circle cx={x} cy={y - 13.5} r="3.4" fill="#0888ad" />
                </>
              ) : null}
            </g>
          );
        })}

        {/*
        Seconde passe : les étiquettes, toujours au-dessus. Dessinées avec
        leur cercle, elles se faisaient recouvrir par le cercle suivant.
      */}
        {cles.map((cle) => {
          const { x, y, r } = positions[cle];
          const actif = covered.has(cle);
          const largeur = Math.max(60, labels[cle].length * 7.2 + 22);
          return (
            <g key={`etiquette-${cle}`} transform={`translate(${x - largeur / 2} ${y + r - 10})`}>
              <rect
                width={largeur}
                height="24"
                rx="12"
                fill={actif ? "#080d1a" : "#ffffff"}
                stroke={actif ? "#ffffff" : "#cbd5e1"}
                strokeWidth={actif ? 1.5 : 1}
              />
              <text
                x={largeur / 2}
                y="16"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={actif ? "#ffffff" : "#475569"}
                fontFamily="var(--font-inter), var(--font-cairo), system-ui, sans-serif"
              >
                {labels[cle]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
