/**
 * Illustrations vectorielles maison.
 *
 * Choix assumé : plutôt que des photos de banque d'images (licences à vérifier,
 * poids élevé, style hétérogène), le site est illustré par des scènes SVG
 * dessinées pour ce projet. Elles sont légères (quelques kilo-octets), nettes
 * sur tous les écrans, cohérentes avec la charte, et ne dépendent d'aucun
 * service externe qui pourrait tomber. L'administrateur peut à tout moment
 * publier de vraies photos de chantier depuis la console : la galerie gère les
 * deux.
 */

interface SceneProps {
  className?: string;
  title?: string;
}

const AQUA = "#22ccee";
const AQUA_DEEP = "#0888ad";
const VOLT = "#fbbf24";
const INK = "#0c1424";

/* ------------------------------------------------------------------ héros */

/**
 * Scène du héros : une maison en coupe où circulent l'eau (bleu) et le courant
 * (ambre). Les deux flux sont animés par un pointillé qui avance — la seule
 * animation continue de la page, et elle porte le message du site.
 */
export function HouseSystemsScene({ className }: SceneProps) {
  return (
    <svg
      viewBox="0 0 520 440"
      className={className}
      role="img"
      aria-label="Schéma d'une maison : circuit d'eau et circuit électrique"
    >
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d2236" />
          <stop offset="100%" stopColor="#071019" />
        </linearGradient>
        <linearGradient id="hs-water" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={AQUA} />
          <stop offset="100%" stopColor={AQUA_DEEP} />
        </linearGradient>
        <linearGradient id="hs-volt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={VOLT} />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id="hs-glow" cx="50%" cy="40%">
          <stop offset="0%" stopColor={AQUA} stopOpacity="0.32" />
          <stop offset="100%" stopColor={AQUA} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="520" height="440" rx="28" fill="url(#hs-sky)" />
      <circle cx="260" cy="180" r="190" fill="url(#hs-glow)" />

      {/* toiture et enveloppe */}
      <path
        d="M60 180 260 60l200 120v190a14 14 0 0 1-14 14H74a14 14 0 0 1-14-14V180Z"
        fill="#0f1c2e"
        stroke="#25405c"
        strokeWidth="2.5"
      />
      <path d="M44 186 260 44l216 142" fill="none" stroke="#33587d" strokeWidth="4" strokeLinecap="round" />

      {/* séparations intérieures */}
      <path d="M60 268h400M262 268v116" stroke="#1c3145" strokeWidth="2" />

      {/* circuit d'eau */}
      <path
        d="M104 232h84v70h96"
        fill="none"
        stroke="url(#hs-water)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="14 12"
        style={{ animation: "spark 4.5s linear infinite" }}
      />
      <path d="M104 232h84v70h96" fill="none" stroke={AQUA} strokeWidth="5" strokeLinecap="round" opacity="0.15" />

      {/* circuit électrique */}
      <path
        d="M416 214h-70v96h-84"
        fill="none"
        stroke="url(#hs-volt)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="10 14"
        style={{ animation: "spark 3.2s linear infinite reverse" }}
      />
      <path d="M416 214h-70v96h-84" fill="none" stroke={VOLT} strokeWidth="5" strokeLinecap="round" opacity="0.14" />

      {/* chauffe-eau */}
      <rect x="82" y="188" width="46" height="76" rx="14" fill="#12283c" stroke={AQUA} strokeWidth="2.5" />
      <path d="M96 208h18M96 220h18" stroke={AQUA} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="105" cy="244" r="6" fill={AQUA} opacity="0.85" />

      {/* évier */}
      <rect x="238" y="296" width="88" height="14" rx="6" fill="#16324a" stroke={AQUA} strokeWidth="2" />
      <path d="M262 296v-22a14 14 0 0 1 14-14h16" fill="none" stroke={AQUA} strokeWidth="3" strokeLinecap="round" />
      <circle cx="292" cy="330" r="5" fill={AQUA}>
        <animate attributeName="cy" values="316;348" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="2.4s" repeatCount="indefinite" />
      </circle>

      {/* tableau électrique */}
      <rect x="392" y="176" width="52" height="76" rx="10" fill="#12283c" stroke={VOLT} strokeWidth="2.5" />
      <rect x="404" y="192" width="12" height="18" rx="3" fill={VOLT} opacity="0.9" />
      <rect x="422" y="192" width="12" height="18" rx="3" fill={VOLT} opacity="0.55" />
      <rect x="404" y="218" width="12" height="18" rx="3" fill={VOLT} opacity="0.55" />
      <rect x="422" y="218" width="12" height="18" rx="3" fill={VOLT} opacity="0.9" />

      {/* luminaire */}
      <path d="M178 310v-18" stroke={VOLT} strokeWidth="3" strokeLinecap="round" />
      <path d="M158 310h40l-10 20h-20l-10-20Z" fill="#1b2f45" stroke={VOLT} strokeWidth="2.5" />
      <path d="M164 330h28l22 54h-72l22-54Z" fill={VOLT} opacity="0.14">
        <animate attributeName="opacity" values="0.08;0.22;0.08" dur="3.8s" repeatCount="indefinite" />
      </path>

      {/* porte */}
      <rect x="238" y="330" width="52" height="54" rx="6" fill="#0d1b2a" stroke="#2a4763" strokeWidth="2" />
      <circle cx="280" cy="358" r="3" fill="#4d7ba3" />
    </svg>
  );
}

/* --------------------------------------------------------------- galerie */

function Frame({ children, tint = AQUA }: { children: React.ReactNode; tint?: string }) {
  return (
    <>
      <rect x="0" y="0" width="400" height="300" rx="20" fill={INK} />
      <circle cx="200" cy="120" r="150" fill={tint} opacity="0.1" />
      <path d="M0 240h400" stroke="#1c3145" strokeWidth="2" />
      {children}
    </>
  );
}

function scene(children: React.ReactNode, label: string, tint = AQUA) {
  return function Scene({ className, title }: SceneProps) {
    return (
      <svg viewBox="0 0 400 300" className={className} role="img" aria-label={title ?? label}>
        <Frame tint={tint}>{children}</Frame>
      </svg>
    );
  };
}

export const FaucetScene = scene(
  <>
    <rect x="96" y="196" width="208" height="18" rx="8" fill="#16324a" stroke={AQUA} strokeWidth="2.5" />
    <path d="M150 196v-46a20 20 0 0 1 20-20h44" fill="none" stroke={AQUA} strokeWidth="7" strokeLinecap="round" />
    <rect x="206" y="112" width="46" height="26" rx="8" fill="#12283c" stroke={AQUA} strokeWidth="2.5" />
    <path d="M132 186v-16" stroke={AQUA} strokeWidth="5" strokeLinecap="round" />
    <circle cx="150" cy="176" r="6" fill={AQUA} opacity="0.9" />
    <circle cx="150" cy="240" r="7" fill={AQUA} opacity="0.75" />
  </>,
  "Installation d'un robinet",
);

export const LeakScene = scene(
  <>
    <path
      d="M60 130h150a26 26 0 0 1 26 26v34"
      fill="none"
      stroke={AQUA}
      strokeWidth="10"
      strokeLinecap="round"
      opacity="0.85"
    />
    <rect x="196" y="118" width="26" height="26" rx="6" fill="#12283c" stroke={AQUA} strokeWidth="2.5" />
    <circle cx="236" cy="212" r="7" fill={AQUA} />
    <circle cx="236" cy="236" r="5" fill={AQUA} opacity="0.6" />
    <path d="M186 250h108l-12 34H198l-12-34Z" fill="#13293d" stroke={AQUA} strokeWidth="2.5" />
    <path d="M196 264h88" stroke={AQUA} strokeWidth="3" opacity="0.5" />
  </>,
  "Réparation d'une fuite",
);

export const PanelScene = scene(
  <>
    <rect x="118" y="70" width="164" height="150" rx="16" fill="#12283c" stroke={VOLT} strokeWidth="3" />
    <path d="M118 112h164" stroke={VOLT} strokeWidth="2" opacity="0.5" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={138 + i * 26} y="130" width="16" height="34" rx="4" fill={VOLT} opacity={i % 2 ? 0.5 : 0.9} />
    ))}
    <rect x="138" y="180" width="126" height="10" rx="5" fill={VOLT} opacity="0.25" />
    <path d="M200 70V44" stroke={VOLT} strokeWidth="3" strokeLinecap="round" />
  </>,
  "Tableau électrique",
  VOLT,
);

export const LightingScene = scene(
  <>
    <path d="M60 84h280" stroke="#2a4763" strokeWidth="4" strokeLinecap="round" />
    {[110, 200, 290].map((x) => (
      <g key={x}>
        <circle cx={x} cy="84" r="12" fill="#12283c" stroke={VOLT} strokeWidth="2.5" />
        <path d={`M${x - 34} 190 L${x} 96 L${x + 34} 190 Z`} fill={VOLT} opacity="0.14" />
        <circle cx={x} cy="84" r="5" fill={VOLT} />
      </g>
    ))}
    <path d="M60 232h280" stroke="#1c3145" strokeWidth="3" />
  </>,
  "Installation d'éclairage",
  VOLT,
);

export const FaultScene = scene(
  <>
    <path d="M70 150h90" stroke={VOLT} strokeWidth="8" strokeLinecap="round" opacity="0.8" />
    <path d="M240 150h90" stroke={VOLT} strokeWidth="8" strokeLinecap="round" opacity="0.35" />
    <path d="M206 92 168 156h30l-6 56 46-70h-30l-2-50Z" fill={VOLT} opacity="0.95" />
    <circle cx="200" cy="150" r="76" fill="none" stroke={VOLT} strokeWidth="2" opacity="0.28" />
    <circle cx="200" cy="150" r="100" fill="none" stroke={VOLT} strokeWidth="2" opacity="0.14" />
  </>,
  "Recherche de panne électrique",
  VOLT,
);

export const BoilerScene = scene(
  <>
    <rect x="140" y="56" width="120" height="150" rx="26" fill="#12283c" stroke={AQUA} strokeWidth="3" />
    <path d="M164 96h72M164 118h72" stroke={AQUA} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    <circle cx="200" cy="164" r="18" fill={AQUA} opacity="0.28" />
    <circle cx="200" cy="164" r="8" fill={AQUA} />
    <path d="M168 206v28M232 206v28" stroke={AQUA} strokeWidth="6" strokeLinecap="round" />
    <path d="M120 240h160" stroke="#1c3145" strokeWidth="3" />
  </>,
  "Chauffe-eau",
);

export const DrainScene = scene(
  <>
    <circle cx="200" cy="150" r="76" fill="#12283c" stroke={AQUA} strokeWidth="3" />
    <circle cx="200" cy="150" r="48" fill="none" stroke={AQUA} strokeWidth="2.5" opacity="0.7" />
    <circle cx="200" cy="150" r="22" fill="none" stroke={AQUA} strokeWidth="2.5" opacity="0.5" />
    <path d="M124 150h152M200 74v152" stroke={AQUA} strokeWidth="2.5" opacity="0.55" />
    <circle cx="200" cy="150" r="8" fill={AQUA} />
  </>,
  "Débouchage d'une évacuation",
);

export const BathroomScene = scene(
  <>
    <path
      d="M84 156h232v34a44 44 0 0 1-44 44H128a44 44 0 0 1-44-44v-34Z"
      fill="#12283c"
      stroke={AQUA}
      strokeWidth="3"
    />
    <path d="M124 156V92a24 24 0 0 1 24-24h14" fill="none" stroke={AQUA} strokeWidth="5" strokeLinecap="round" />
    <rect x="152" y="58" width="40" height="22" rx="7" fill="#16324a" stroke={AQUA} strokeWidth="2.5" />
    <path d="M116 234l-10 22M284 234l10 22" stroke={AQUA} strokeWidth="5" strokeLinecap="round" />
    <circle cx="172" cy="120" r="5" fill={AQUA} opacity="0.8" />
  </>,
  "Salle de bain rénovée",
);

const scenes: Record<string, (props: SceneProps) => React.JSX.Element> = {
  "faucet-scene": FaucetScene,
  "leak-scene": LeakScene,
  "panel-scene": PanelScene,
  "lighting-scene": LightingScene,
  "fault-scene": FaultScene,
  "boiler-scene": BoilerScene,
  "drain-scene": DrainScene,
  "bathroom-scene": BathroomScene,
};

export const illustrationKeys = Object.keys(scenes);

export function Illustration({ name, className, title }: SceneProps & { name: string }) {
  const Scene = scenes[name] ?? FaucetScene;
  return <Scene className={className} title={title} />;
}
