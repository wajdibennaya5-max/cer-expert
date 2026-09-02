import { services, type Service, type ServiceCategory } from "@/content/services";
import type { Locale } from "@/lib/i18n/config";

/**
 * Base de connaissances de l'assistant.
 *
 * Elle sert deux objectifs : orienter le visiteur vers la bonne prestation, et
 * refuser tout diagnostic hasardeux. L'assistant ne prétend jamais réparer à
 * distance : il qualifie le besoin, donne les gestes de sécurité reconnus et
 * transmet la demande à un professionnel.
 */

export type Tone = "info" | "warning" | "success";

/** Normalise pour la comparaison : minuscules, sans accents. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------- sécurité */

export interface SafetyRule {
  key: string;
  patterns: string[];
  message: Record<Locale, string>;
  /** Une situation critique bascule la demande en urgence et pousse l'appel direct. */
  critical: boolean;
}

export const safetyRules: SafetyRule[] = [
  {
    key: "gas",
    critical: true,
    patterns: ["odeur de gaz", "sent le gaz", "fuite de gaz", "gaz", "gas leak", "رائحة غاز", "تسرب غاز"],
    message: {
      fr: "⚠️ Odeur de gaz : n'actionnez aucun interrupteur, ne téléphonez pas depuis la pièce, ouvrez les fenêtres, fermez l'arrivée de gaz et sortez. Contactez immédiatement le service d'urgence gaz, puis appelez-nous depuis l'extérieur.",
      en: "⚠️ Gas smell: do not touch any switch, do not phone from that room, open the windows, shut off the gas supply and leave. Contact the emergency gas service immediately, then call us from outside.",
      ar: "⚠️ رائحة غاز: لا تلمس أي مفتاح، لا تتصل من داخل الغرفة، افتح النوافذ، اغلق التغذية بالغاز واخرج. اتصل فورًا بمصلحة الطوارئ للغاز ثم اتصل بنا من الخارج.",
    },
  },
  {
    key: "burning",
    critical: true,
    patterns: [
      "odeur de brule",
      "ca sent le brule",
      "sent le brule",
      "fumee",
      "etincelle",
      "etincelles",
      "prise qui chauffe",
      "burning smell",
      "smoke",
      "spark",
      "رائحة احتراق",
      "دخان",
      "شرر",
    ],
    message: {
      fr: "⚠️ Odeur de brûlé, fumée ou étincelles : coupez immédiatement le disjoncteur général et ne rebranchez rien. Ne tentez pas de réarmer. Si un départ de feu apparaît, appelez les secours. Appelez-nous ensuite : cette situation est traitée en priorité absolue.",
      en: "⚠️ Burning smell, smoke or sparks: switch off the main breaker immediately and plug nothing back in. Do not attempt to reset it. If a fire starts, call the emergency services. Then call us — this is handled as top priority.",
      ar: "⚠️ رائحة احتراق أو دخان أو شرر: اقطع القاطع العام فورًا ولا تعِد توصيل أي شيء ولا تحاول إرجاعه. إذا بدأ حريق فاتصل بالحماية المدنية، ثم اتصل بنا: هذه الحالة لها أولوية قصوى.",
    },
  },
  {
    key: "water-electricity",
    critical: true,
    patterns: [
      "eau sur le tableau",
      "eau dans la prise",
      "eau et electricite",
      "inondation",
      "inonde",
      "eau partout",
      "flood",
      "water on the socket",
      "فيضان",
      "ماء في الكهرباء",
    ],
    message: {
      fr: "⚠️ Eau à proximité d'une prise, d'un tableau ou d'un appareil : coupez l'électricité au disjoncteur général avant toute chose, puis fermez l'arrivée d'eau. Ne touchez ni l'eau ni les appareils. Appelez-nous immédiatement.",
      en: "⚠️ Water near a socket, panel or appliance: cut the power at the main breaker first, then close the water supply. Do not touch the water or the appliances. Call us immediately.",
      ar: "⚠️ ماء قرب مأخذ أو لوحة أو جهاز: اقطع الكهرباء من القاطع العام أولًا ثم اغلق الماء. لا تلمس الماء ولا الأجهزة. اتصل بنا فورًا.",
    },
  },
  {
    key: "shock",
    critical: true,
    patterns: ["electrocute", "choc electrique", "j'ai pris le jus", "electric shock", "صعقة", "صعقة كهربائية"],
    message: {
      fr: "⚠️ Choc électrique : si une personne est blessée, appelez les secours sans attendre. Coupez le disjoncteur général avant de toucher quoi que ce soit. N'utilisez plus le circuit concerné tant qu'il n'a pas été vérifié.",
      en: "⚠️ Electric shock: if anyone is hurt, call the emergency services right away. Switch off the main breaker before touching anything. Do not use that circuit again until it has been checked.",
      ar: "⚠️ صعقة كهربائية: إذا أُصيب شخص فاتصل بالإسعاف فورًا. اقطع القاطع العام قبل لمس أي شيء، ولا تستعمل تلك الدائرة قبل فحصها.",
    },
  },
  {
    key: "major-leak",
    critical: false,
    patterns: ["gros degat", "degat des eaux", "ca coule beaucoup", "tuyau casse", "burst pipe", "أنبوب انفجر"],
    message: {
      fr: "Premier réflexe : fermez le robinet d'arrêt général pour stopper l'arrivée d'eau. Épongez ce que vous pouvez sans risque, et coupez l'électricité si l'eau approche une prise.",
      en: "First reflex: close the main stopcock to stop the water. Mop up what you safely can, and cut the power if the water gets near a socket.",
      ar: "أول إجراء: اغلق الصنبور العام لإيقاف الماء. جفف ما يمكنك بأمان، واقطع الكهرباء إذا اقترب الماء من مأخذ.",
    },
  },
];

export function detectSafety(input: string): SafetyRule | undefined {
  const text = normalize(input);
  return safetyRules.find((rule) => rule.patterns.some((pattern) => text.includes(normalize(pattern))));
}

/* ------------------------------------------------------- reconnaissance */

const categoryHints: Record<ServiceCategory, string[]> = {
  plomberie: [
    "eau",
    "fuite",
    "robinet",
    "wc",
    "toilette",
    "douche",
    "evier",
    "lavabo",
    "chauffe",
    "canalisation",
    "bouche",
    "siphon",
    "tuyau",
    "chasse",
    "sanitaire",
    "humidite",
    "water",
    "leak",
    "drain",
    "toilet",
    "ماء",
    "سباكة",
    "تسريب",
    "حنفية",
    "مرحاض",
    "انسداد",
  ],
  electricite: [
    "electri",
    "courant",
    "prise",
    "interrupteur",
    "lumiere",
    "lampe",
    "ampoule",
    "disjonct",
    "tableau",
    "panne",
    "court-circuit",
    "compteur",
    "eclairage",
    "led",
    "power",
    "socket",
    "light",
    "breaker",
    "كهرباء",
    "تيار",
    "مأخذ",
    "إنارة",
    "لمبة",
    "قاطع",
    "عطل",
  ],
};

export interface Suggestion {
  service?: Service;
  category?: ServiceCategory;
  score: number;
}

/** Reconnaît le besoin décrit en texte libre à partir des mots-clés des prestations. */
export function classify(input: string): Suggestion {
  const text = normalize(input);
  if (!text) return { score: 0 };

  let best: { service: Service; score: number } | undefined;
  for (const service of services) {
    let score = 0;
    for (const keyword of service.keywords) {
      const needle = normalize(keyword);
      if (needle.length >= 3 && text.includes(needle)) score += needle.length >= 6 ? 3 : 2;
    }
    for (const word of normalize(service.name.fr).split(" ")) {
      if (word.length >= 5 && text.includes(word)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { service, score };
  }

  let category: ServiceCategory | undefined = best?.service.category;
  if (!category) {
    let plumbing = 0;
    let electrical = 0;
    for (const hint of categoryHints.plomberie) if (text.includes(normalize(hint))) plumbing += 1;
    for (const hint of categoryHints.electricite) if (text.includes(normalize(hint))) electrical += 1;
    if (plumbing || electrical) category = plumbing >= electrical ? "plomberie" : "electricite";
  }

  return { service: best?.service, category, score: best?.score ?? 0 };
}

/** Conseils immédiats, volontairement limités aux gestes sans risque. */
export const firstAid: Record<ServiceCategory, Record<Locale, string>> = {
  plomberie: {
    fr: "En attendant notre passage : si de l'eau s'écoule, fermez le robinet d'arrêt le plus proche (sous l'évier, derrière le WC) ou le robinet général. N'utilisez plus l'équipement concerné.",
    en: "While you wait: if water is escaping, close the nearest stopcock (under the sink, behind the toilet) or the main valve. Stop using the fixture concerned.",
    ar: "في انتظار قدومنا: إن كان الماء يتسرب فاغلق أقرب صنبور غلق (تحت الحوض أو خلف المرحاض) أو الصنبور العام، ولا تستعمل التجهيز المعني.",
  },
  electricite: {
    fr: "En attendant notre passage : n'utilisez pas le circuit concerné et débranchez les appareils qui y sont raccordés. Si le disjoncteur retombe à chaque réarmement, laissez-le en position coupée.",
    en: "While you wait: stop using the affected circuit and unplug the appliances on it. If the breaker trips again each time you reset it, leave it switched off.",
    ar: "في انتظار قدومنا: لا تستعمل الدائرة المعنية وافصل الأجهزة الموصولة بها. إذا سقط القاطع في كل مرة، اتركه مفصولًا.",
  },
};
