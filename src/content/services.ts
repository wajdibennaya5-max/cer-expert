import type { Locale } from "@/lib/i18n/config";

export type LocalizedText = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export type ServiceCategory = "plomberie" | "electricite";

export interface Service {
  /** Identifiant d'URL, stable : ne jamais le modifier après mise en ligne (SEO). */
  slug: string;
  category: ServiceCategory;
  icon: string;
  name: LocalizedText;
  short: LocalizedText;
  detail: LocalizedText;
  includes: LocalizedList;
  /** Mots-clés utilisés par l'assistant pour reconnaître le besoin décrit par le visiteur. */
  keywords: string[];
  /** Signale une prestation typiquement urgente (mise en avant + tri). */
  emergency?: boolean;
}

export const categories: Record<
  ServiceCategory,
  { icon: string; label: LocalizedText; short: LocalizedText; accent: "aqua" | "volt" }
> = {
  plomberie: {
    icon: "droplet",
    accent: "aqua",
    label: { fr: "Plomberie", en: "Plumbing", ar: "السباكة" },
    short: {
      fr: "Fuites, sanitaires, chauffe-eau, débouchage : une intervention propre et durable.",
      en: "Leaks, fixtures, water heaters, unclogging: clean and lasting workmanship.",
      ar: "تسريبات، أدوات صحية، سخانات، تسليك: تدخل نظيف ودائم.",
    },
  },
  electricite: {
    icon: "bolt",
    accent: "volt",
    label: { fr: "Électricité", en: "Electrical", ar: "الكهرباء" },
    short: {
      fr: "Pannes, tableaux, prises, éclairage : une installation sûre et aux normes.",
      en: "Faults, panels, sockets, lighting: safe installations done to standard.",
      ar: "أعطال، لوحات، مآخذ، إنارة: تركيب آمن ومطابق للمعايير.",
    },
  },
};

const plumbingServices: Service[] = [
  {
    slug: "reparation-fuite-eau",
    category: "plomberie",
    icon: "droplet",
    emergency: true,
    keywords: ["fuite", "fuit", "goutte", "eau qui coule", "infiltration", "leak", "تسريب", "ماء"],
    name: { fr: "Réparation de fuites d'eau", en: "Water leak repair", ar: "إصلاح تسربات المياه" },
    short: {
      fr: "Arrêt immédiat de la fuite, réparation durable et remise en état propre.",
      en: "Immediate stop, lasting repair and a clean finish.",
      ar: "إيقاف فوري للتسرب، إصلاح دائم وإعادة الوضع نظيفًا.",
    },
    detail: {
      fr: "Une fuite non traitée abîme les murs, fait grimper la facture d'eau et peut atteindre l'installation électrique. Nous localisons l'origine exacte, coupons proprement l'arrivée, remplaçons la pièce défectueuse et vérifions l'étanchéité avant de partir.",
      en: "An untreated leak damages walls, inflates the water bill and can reach the electrical installation. We locate the exact source, shut off the supply cleanly, replace the faulty part and pressure-check the repair before leaving.",
      ar: "التسرب المهمل يتلف الجدران ويرفع فاتورة الماء وقد يصل إلى التمديدات الكهربائية. نحدد المصدر بدقة، نغلق التغذية، نستبدل القطعة التالفة ونتحقق من الإحكام قبل المغادرة.",
    },
    includes: {
      fr: [
        "Localisation de l'origine de la fuite",
        "Remplacement des joints et raccords",
        "Test d'étanchéité après réparation",
        "Nettoyage de la zone d'intervention",
      ],
      en: ["Pinpointing the source", "Seal and fitting replacement", "Leak test after repair", "Work area cleaned"],
      ar: ["تحديد مصدر التسرب", "تعويض الحشوات والوصلات", "اختبار الإحكام بعد الإصلاح", "تنظيف مكان التدخل"],
    },
  },
  {
    slug: "installation-robinetterie",
    category: "plomberie",
    icon: "faucet",
    keywords: ["robinet", "mitigeur", "mélangeur", "faucet", "tap", "حنفية", "صنبور"],
    name: { fr: "Installation de robinets", en: "Tap & mixer installation", ar: "تركيب الحنفيات" },
    short: {
      fr: "Pose et remplacement de robinets et mitigeurs, cuisine comme salle de bain.",
      en: "Fitting and replacing taps and mixers, kitchen and bathroom alike.",
      ar: "تركيب وتعويض الحنفيات والخلاطات في المطبخ والحمام.",
    },
    detail: {
      fr: "Robinet qui goutte, mitigeur bloqué ou modèle à remplacer : nous démontons l'ancien équipement sans abîmer le plan de travail, posons le nouveau avec des raccords neufs et contrôlons la pression et l'écoulement.",
      en: "Dripping tap, seized mixer or an upgrade: we remove the old unit without damaging the worktop, fit the new one with fresh connectors, then check pressure and flow.",
      ar: "حنفية تقطر أو خلاط معطل أو تغيير للنموذج: نفك القديم دون إتلاف السطح، ونركب الجديد بوصلات جديدة مع مراقبة الضغط والتدفق.",
    },
    includes: {
      fr: [
        "Dépose de l'ancien robinet",
        "Pose avec raccords neufs",
        "Réglage du débit et contrôle des fuites",
        "Conseil sur le modèle adapté",
      ],
      en: [
        "Old tap removal",
        "Installation with new connectors",
        "Flow adjustment and leak check",
        "Advice on the right model",
      ],
      ar: ["نزع الحنفية القديمة", "التركيب بوصلات جديدة", "ضبط التدفق ومراقبة التسرب", "نصيحة حول النموذج المناسب"],
    },
  },
  {
    slug: "reparation-sanitaires",
    category: "plomberie",
    icon: "bath",
    keywords: ["wc", "toilette", "chasse", "lavabo", "évier", "douche", "baignoire", "مرحاض", "مغسلة"],
    name: {
      fr: "Réparation et remplacement de sanitaires",
      en: "Bathroom fixture repair & replacement",
      ar: "إصلاح وتعويض الأدوات الصحية",
    },
    short: {
      fr: "WC, lavabo, évier, douche : réparation ou remplacement complet.",
      en: "Toilets, basins, sinks, showers: repaired or fully replaced.",
      ar: "مرحاض، مغسلة، حوض، دُش: إصلاح أو تعويض كامل.",
    },
    detail: {
      fr: "Chasse d'eau qui fuit, lavabo fissuré, évier mal fixé : nous réparons quand c'est possible et remplaçons quand c'est plus économique à long terme. Vous êtes prévenu du choix avant l'intervention.",
      en: "Running cistern, cracked basin, loose sink: we repair where it makes sense and replace when that is the better long-term call — and we tell you which before starting.",
      ar: "صندوق طرد يسرب، مغسلة متشققة، حوض غير مثبت: نصلح عند الإمكان ونعوض عندما يكون ذلك أجدى، ونعلمك بالخيار قبل التدخل.",
    },
    includes: {
      fr: [
        "Diagnostic de l'équipement",
        "Remplacement des mécanismes de chasse",
        "Pose de sanitaires neufs",
        "Reprise des scellements et silicone",
      ],
      en: [
        "Fixture diagnosis",
        "Cistern mechanism replacement",
        "New fixture installation",
        "Sealing and silicone finish",
      ],
      ar: ["تشخيص التجهيزات", "تعويض آليات الطرد", "تركيب أدوات صحية جديدة", "إعادة العزل والسيليكون"],
    },
  },
  {
    slug: "chauffe-eau",
    category: "plomberie",
    icon: "boiler",
    keywords: ["chauffe-eau", "chauffe eau", "ballon", "eau chaude", "chaudière", "water heater", "سخان", "ماء ساخن"],
    name: {
      fr: "Installation et réparation de chauffe-eau",
      en: "Water heater installation & repair",
      ar: "تركيب وإصلاح السخانات",
    },
    short: {
      fr: "Plus d'eau chaude ? Diagnostic, détartrage, réparation ou pose d'un neuf.",
      en: "No hot water? Diagnosis, descaling, repair or a new unit fitted.",
      ar: "لا ماء ساخن؟ تشخيص، إزالة الترسبات، إصلاح أو تركيب جديد.",
    },
    detail: {
      fr: "Résistance entartrée, thermostat hors service, groupe de sécurité qui goutte : la panne est identifiée avant tout devis. L'installation d'un nouvel appareil comprend le raccordement hydraulique et le contrôle du branchement électrique.",
      en: "Scaled element, dead thermostat, dripping safety valve: the fault is identified before any quote. A new unit includes the water connection and a check of the electrical hook-up.",
      ar: "مقاومة متكلسة، ثرموستات معطل، صمام أمان يسرب: يُحدد العطل قبل أي تسعيرة. تركيب جهاز جديد يشمل الربط المائي ومراقبة التوصيل الكهربائي.",
    },
    includes: {
      fr: [
        "Diagnostic complet de l'appareil",
        "Détartrage et remplacement de résistance",
        "Remplacement du groupe de sécurité",
        "Pose et raccordement d'un chauffe-eau neuf",
      ],
      en: [
        "Full appliance diagnosis",
        "Descaling and element replacement",
        "Safety valve replacement",
        "New heater fitted and connected",
      ],
      ar: ["تشخيص كامل للجهاز", "إزالة الترسبات وتعويض المقاومة", "تعويض صمام الأمان", "تركيب وربط سخان جديد"],
    },
  },
  {
    slug: "debouchage-canalisation",
    category: "plomberie",
    icon: "drain",
    emergency: true,
    keywords: ["bouché", "bouchée", "débouchage", "évacuation", "canalisation", "odeur", "clog", "انسداد", "تسليك"],
    name: { fr: "Débouchage de canalisations", en: "Drain unclogging", ar: "تسليك القنوات" },
    short: {
      fr: "Évier, douche, WC ou colonne bouchée : évacuation rétablie rapidement.",
      en: "Sink, shower, toilet or main stack: flow restored quickly.",
      ar: "حوض، دُش، مرحاض أو عمود مسدود: إعادة التصريف بسرعة.",
    },
    detail: {
      fr: "Nous commençons par le moins agressif — furet, ventouse mécanique, démontage du siphon — avant toute solution lourde, pour préserver vos canalisations. La cause du bouchon est identifiée pour éviter la récidive.",
      en: "We start with the least aggressive method — auger, mechanical plunger, trap removal — before anything heavier, to protect your pipework. The cause is identified so it does not come back.",
      ar: "نبدأ بالأقل عدوانية — سلك التسليك، المكبس، فك السيفون — قبل أي حل ثقيل حفاظًا على القنوات، ونحدد السبب لتفادي التكرار.",
    },
    includes: {
      fr: [
        "Débouchage mécanique au furet",
        "Démontage et nettoyage du siphon",
        "Contrôle de l'écoulement",
        "Conseils pour éviter la récidive",
      ],
      en: [
        "Mechanical auger unclogging",
        "Trap removal and cleaning",
        "Flow verification",
        "Advice to prevent recurrence",
      ],
      ar: ["تسليك ميكانيكي بالسلك", "فك السيفون وتنظيفه", "مراقبة التصريف", "نصائح لتفادي التكرار"],
    },
  },
  {
    slug: "reparation-tuyauterie",
    category: "plomberie",
    icon: "pipe",
    keywords: ["tuyau", "tuyauterie", "canalisation cassée", "pvc", "cuivre", "pipe", "أنبوب", "قنوات"],
    name: { fr: "Réparation de tuyauterie", en: "Pipework repair", ar: "إصلاح الأنابيب" },
    short: {
      fr: "Tuyau percé, fissuré ou gelé : réparation ou remplacement de section.",
      en: "Pierced, cracked or frozen pipe: section repaired or replaced.",
      ar: "أنبوب مثقوب أو متشقق: إصلاح أو تعويض المقطع.",
    },
    detail: {
      fr: "Cuivre, PER ou PVC : la section abîmée est remplacée avec le bon matériau et les bons raccords, jamais avec une réparation provisoire présentée comme définitive.",
      en: "Copper, PEX or PVC: the damaged section is replaced with the right material and fittings — never a temporary patch presented as permanent.",
      ar: "نحاس أو PER أو PVC: يُعوّض المقطع التالف بالمادة والوصلات المناسبة، دون إصلاح مؤقت يُقدَّم كنهائي.",
    },
    includes: {
      fr: [
        "Remplacement de section endommagée",
        "Raccords adaptés au matériau",
        "Mise en pression et contrôle",
        "Remise en état après travaux",
      ],
      en: [
        "Damaged section replacement",
        "Material-matched fittings",
        "Pressure test and check",
        "Site restored after work",
      ],
      ar: ["تعويض المقطع التالف", "وصلات مناسبة للمادة", "اختبار الضغط والمراقبة", "إعادة الوضع بعد الأشغال"],
    },
  },
  {
    slug: "recherche-de-fuite",
    category: "plomberie",
    icon: "radar",
    keywords: [
      "recherche de fuite",
      "fuite invisible",
      "mur humide",
      "tache humidité",
      "compteur tourne",
      "رطوبة",
      "تسرب خفي",
    ],
    name: { fr: "Recherche de fuite", en: "Leak detection", ar: "البحث عن التسربات" },
    short: {
      fr: "Mur humide, compteur qui tourne : nous localisons la fuite avant de casser.",
      en: "Damp wall, spinning meter: we find the leak before breaking anything.",
      ar: "جدار رطب أو عدّاد يدور: نحدد التسرب قبل أي كسر.",
    },
    detail: {
      fr: "Une fuite invisible se cherche méthodiquement : isolement des circuits, contrôle du compteur, inspection des points sensibles. L'objectif est de limiter au strict minimum les ouvertures dans les murs et les sols.",
      en: "A hidden leak is found methodically: circuit isolation, meter checks, inspection of weak points. The goal is to keep wall and floor openings to an absolute minimum.",
      ar: "يُبحث عن التسرب الخفي بمنهجية: عزل الدوائر، مراقبة العدّاد، فحص النقاط الحساسة، مع تقليل الفتحات في الجدران والأرضيات.",
    },
    includes: {
      fr: [
        "Contrôle du compteur et des circuits",
        "Inspection des points sensibles",
        "Localisation avant ouverture",
        "Rapport clair de ce qui a été trouvé",
      ],
      en: [
        "Meter and circuit checks",
        "Weak-point inspection",
        "Located before opening up",
        "Clear report of the findings",
      ],
      ar: ["مراقبة العدّاد والدوائر", "فحص النقاط الحساسة", "التحديد قبل الفتح", "تقرير واضح بالنتائج"],
    },
  },
  {
    slug: "installation-equipements-sanitaires",
    category: "plomberie",
    icon: "wrench",
    keywords: [
      "installation",
      "machine à laver",
      "lave-linge",
      "lave-vaisselle",
      "cabine de douche",
      "تركيب",
      "غسالة",
    ],
    name: {
      fr: "Installation d'équipements sanitaires",
      en: "Sanitary equipment installation",
      ar: "تركيب التجهيزات الصحية",
    },
    short: {
      fr: "Machine à laver, lave-vaisselle, cabine de douche : raccordement dans les règles.",
      en: "Washing machine, dishwasher, shower cabin: connected properly.",
      ar: "غسالة، جلاية، كابينة دُش: ربط وفق الأصول.",
    },
    detail: {
      fr: "Un appareil mal raccordé finit en dégât des eaux. Nous installons l'arrivée, l'évacuation et les sécurités, puis effectuons un cycle de test avant de valider l'intervention.",
      en: "A badly connected appliance ends in water damage. We fit the supply, the drain and the safety devices, then run a test cycle before signing off.",
      ar: "الجهاز الموصول بشكل خاطئ يسبب أضرار مياه. نركب التغذية والتصريف وأدوات الأمان، ثم ننفذ دورة اختبار قبل الاعتماد.",
    },
    includes: {
      fr: [
        "Arrivée d'eau et robinet d'arrêt",
        "Évacuation et siphon",
        "Mise à niveau de l'appareil",
        "Cycle de test complet",
      ],
      en: ["Water supply and stopcock", "Drain and trap", "Appliance levelling", "Full test cycle"],
      ar: ["تغذية الماء وصنبور الغلق", "التصريف والسيفون", "ضبط استواء الجهاز", "دورة اختبار كاملة"],
    },
  },
  {
    slug: "maintenance-plomberie",
    category: "plomberie",
    icon: "gauge",
    keywords: ["entretien", "maintenance", "vérification", "contrôle annuel", "صيانة"],
    name: { fr: "Maintenance plomberie", en: "Plumbing maintenance", ar: "صيانة السباكة" },
    short: {
      fr: "Un contrôle régulier coûte moins cher qu'un dégât des eaux.",
      en: "A regular check-up costs far less than water damage.",
      ar: "المراقبة الدورية أقل كلفة من أضرار المياه.",
    },
    detail: {
      fr: "Contrôle des joints, de la pression, du groupe de sécurité et des points de fuite probables. Vous recevez la liste de ce qui est sain et de ce qui devra être surveillé.",
      en: "Seals, pressure, safety valve and likely leak points are all checked. You get a list of what is sound and what needs watching.",
      ar: "مراقبة الحشوات والضغط وصمام الأمان ونقاط التسرب المحتملة، مع قائمة بما هو سليم وما يجب مراقبته.",
    },
    includes: {
      fr: [
        "Contrôle de la pression du réseau",
        "Vérification des joints et raccords",
        "Contrôle du chauffe-eau",
        "Compte rendu écrit",
      ],
      en: ["Network pressure check", "Seal and fitting inspection", "Water heater check", "Written report"],
      ar: ["مراقبة ضغط الشبكة", "فحص الحشوات والوصلات", "مراقبة السخان", "تقرير مكتوب"],
    },
  },
  {
    slug: "depannage-plomberie",
    category: "plomberie",
    icon: "truck",
    emergency: true,
    keywords: ["urgence", "dépannage", "inondation", "dégât des eaux", "vite", "urgent", "طوارئ", "نجدة"],
    name: { fr: "Dépannage plomberie à domicile", en: "Emergency plumbing call-out", ar: "نجدة سباكة بالمنزل" },
    short: {
      fr: "Une urgence ne se planifie pas : appelez, nous organisons le passage au plus vite.",
      en: "Emergencies don't wait: call us and we arrange the earliest possible visit.",
      ar: "الطوارئ لا تُبرمج: اتصل بنا وننظم الزيارة في أقرب وقت.",
    },
    detail: {
      fr: "En cas d'urgence, le plus rapide reste l'appel téléphonique. Premier réflexe à avoir : fermer le robinet d'arrêt général, et couper l'électricité si l'eau approche une prise ou un tableau.",
      en: "In an emergency the phone is fastest. First reflex: close the main stopcock, and cut the power if water is near a socket or the consumer unit.",
      ar: "في الطوارئ الاتصال الهاتفي أسرع. أول إجراء: غلق الصنبور العام، وقطع الكهرباء إذا اقترب الماء من مأخذ أو لوحة.",
    },
    includes: {
      fr: [
        "Prise en charge prioritaire",
        "Conseils immédiats par téléphone",
        "Sécurisation avant réparation",
        "Intervention au plus vite",
      ],
      en: ["Priority handling", "Immediate advice by phone", "Made safe before repair", "Earliest possible visit"],
      ar: ["أولوية في المعالجة", "نصائح فورية عبر الهاتف", "تأمين المكان قبل الإصلاح", "تدخل في أقرب وقت"],
    },
  },
];

const electricalServices: Service[] = [
  {
    slug: "depannage-electrique",
    category: "electricite",
    icon: "bolt",
    emergency: true,
    keywords: ["panne", "coupure", "plus de courant", "disjoncte", "court-circuit", "قطع", "انقطاع الكهرباء"],
    name: { fr: "Dépannage électrique", en: "Emergency electrical call-out", ar: "نجدة كهربائية" },
    short: {
      fr: "Coupure, disjonction à répétition, court-circuit : diagnostic et remise en service.",
      en: "Outage, repeated tripping, short circuit: diagnosed and put back in service.",
      ar: "انقطاع، فصل متكرر، تماس كهربائي: تشخيص وإعادة التشغيل.",
    },
    detail: {
      fr: "Une installation qui disjoncte protège quelque chose : le défaut est cherché avant tout réarmement. En cas d'odeur de brûlé, d'étincelles ou de fils dénudés, coupez le disjoncteur général et appelez-nous sans manipuler l'installation.",
      en: "A tripping installation is protecting something: the fault is found before anything is reset. If you smell burning, see sparks or bare wires, switch off the main breaker and call us without touching the installation.",
      ar: "الفصل المتكرر يحمي من خطر: يُبحث عن العطل قبل إعادة التشغيل. عند رائحة احتراق أو شرر أو أسلاك مكشوفة، اقطع القاطع العام واتصل بنا دون التدخل.",
    },
    includes: {
      fr: [
        "Recherche du défaut avant réarmement",
        "Contrôle du tableau et des circuits",
        "Sécurisation immédiate",
        "Remise en service contrôlée",
      ],
      en: [
        "Fault found before resetting",
        "Panel and circuit checks",
        "Immediate make-safe",
        "Controlled return to service",
      ],
      ar: ["البحث عن العطل قبل الإرجاع", "مراقبة اللوحة والدوائر", "تأمين فوري", "إعادة تشغيل مراقبة"],
    },
  },
  {
    slug: "installation-electrique-domestique",
    category: "electricite",
    icon: "panel",
    keywords: [
      "installation électrique",
      "rénovation",
      "câblage",
      "nouvelle installation",
      "تمديدات",
      "تركيب كهرباء",
    ],
    name: {
      fr: "Installation électrique domestique",
      en: "Home electrical installation",
      ar: "التمديدات الكهربائية المنزلية",
    },
    short: {
      fr: "Création ou rénovation de circuits, du tableau jusqu'aux points d'usage.",
      en: "New or renovated circuits, from the panel to every outlet.",
      ar: "إنشاء أو تجديد الدوائر، من اللوحة إلى نقاط الاستعمال.",
    },
    detail: {
      fr: "Chaque circuit est dimensionné pour son usage : éclairage, prises, gros électroménager. Le repérage du tableau est laissé lisible, pour que la prochaine intervention — la nôtre ou une autre — soit rapide.",
      en: "Every circuit is sized for its purpose: lighting, sockets, heavy appliances. The panel is left clearly labelled so the next intervention — ours or anyone's — is quick.",
      ar: "كل دائرة تُصمم حسب استعمالها: إنارة، مآخذ، أجهزة كبيرة. تُترك اللوحة مرقّمة بوضوح لتسهيل أي تدخل لاحق.",
    },
    includes: {
      fr: [
        "Étude des besoins et des circuits",
        "Câblage et pose des appareillages",
        "Repérage complet du tableau",
        "Contrôle final sous tension",
      ],
      en: ["Needs and circuit study", "Wiring and device fitting", "Full panel labelling", "Final live testing"],
      ar: ["دراسة الحاجيات والدوائر", "التمديد وتركيب الأجهزة", "ترقيم كامل للوحة", "مراقبة نهائية تحت التوتر"],
    },
  },
  {
    slug: "reparation-prises",
    category: "electricite",
    icon: "socket",
    keywords: ["prise", "prise cassée", "prise qui chauffe", "socket", "مأخذ", "بريزة"],
    name: { fr: "Réparation de prises", en: "Socket repair", ar: "إصلاح المآخذ" },
    short: {
      fr: "Prise morte, qui chauffe ou qui bouge : remplacement et mise en sécurité.",
      en: "Dead, hot or loose socket: replaced and made safe.",
      ar: "مأخذ معطل أو ساخن أو متحرك: تعويض وتأمين.",
    },
    detail: {
      fr: "Une prise qui chauffe ou noircit signale un mauvais contact : c'est un début d'incendie potentiel. Le remplacement s'accompagne systématiquement d'un contrôle du serrage et de la section du câble.",
      en: "A hot or blackened socket means a poor contact — the start of a potential fire. Replacement always comes with a check of terminal tightness and cable size.",
      ar: "المأخذ الساخن أو المسودّ يدل على تماس رديء وهو بداية حريق محتمل. يُرافق التعويض دائمًا مراقبة الشد ومقطع الكابل.",
    },
    includes: {
      fr: [
        "Remplacement du mécanisme",
        "Contrôle du serrage des conducteurs",
        "Vérification de la terre",
        "Test de fonctionnement",
      ],
      en: ["Mechanism replacement", "Conductor tightness check", "Earth verification", "Function test"],
      ar: ["تعويض الآلية", "مراقبة شد الموصلات", "التحقق من التأريض", "اختبار التشغيل"],
    },
  },
  {
    slug: "installation-interrupteurs",
    category: "electricite",
    icon: "switch",
    keywords: ["interrupteur", "va-et-vient", "variateur", "switch", "مفتاح", "زر الإنارة"],
    name: {
      fr: "Réparation et installation d'interrupteurs",
      en: "Switch repair & installation",
      ar: "إصلاح وتركيب المفاتيح",
    },
    short: {
      fr: "Simple, va-et-vient ou variateur : pose nette et fonctionnement fiable.",
      en: "Single, two-way or dimmer: cleanly fitted and reliable.",
      ar: "بسيط، مزدوج أو مخفّض: تركيب نظيف وتشغيل موثوق.",
    },
    detail: {
      fr: "Remplacement d'un mécanisme usé, ajout d'un va-et-vient pour commander un éclairage depuis deux endroits, ou pose d'un variateur compatible avec vos ampoules LED.",
      en: "Replacing a worn mechanism, adding a two-way circuit to control a light from two points, or fitting a dimmer that is actually compatible with your LED bulbs.",
      ar: "تعويض آلية مستهلكة، إضافة مفتاح مزدوج للتحكم في الإنارة من نقطتين، أو تركيب مخفّض متوافق مع مصابيح LED.",
    },
    includes: {
      fr: [
        "Remplacement de mécanisme",
        "Création de va-et-vient",
        "Pose de variateur compatible LED",
        "Finition alignée et propre",
      ],
      en: [
        "Mechanism replacement",
        "Two-way circuit creation",
        "LED-compatible dimmer fitting",
        "Aligned, clean finish",
      ],
      ar: ["تعويض الآلية", "إنشاء دائرة مزدوجة", "تركيب مخفّض متوافق مع LED", "تشطيب مستقيم ونظيف"],
    },
  },
  {
    slug: "installation-luminaires",
    category: "electricite",
    icon: "bulb",
    keywords: ["luminaire", "lustre", "applique", "spot", "plafonnier", "lampe", "ثريا", "إنارة"],
    name: { fr: "Installation de luminaires", en: "Light fitting installation", ar: "تركيب أجهزة الإنارة" },
    short: {
      fr: "Lustre, applique, spots encastrés : fixation solide et raccordement propre.",
      en: "Chandeliers, wall lights, recessed spots: solidly fixed, cleanly wired.",
      ar: "ثريا، مصباح جداري، سبوتات: تثبيت متين وربط نظيف.",
    },
    detail: {
      fr: "La fixation compte autant que le branchement : un luminaire lourd exige une cheville adaptée au support. Nous posons également des spots encastrés avec le respect des distances d'isolation.",
      en: "The fixing matters as much as the wiring: a heavy fitting needs an anchor matched to the substrate. Recessed spots are installed respecting insulation clearances.",
      ar: "التثبيت لا يقل أهمية عن الربط: الجهاز الثقيل يتطلب خابورًا مناسبًا للسند، ونركب السبوتات مع احترام مسافات العزل.",
    },
    includes: {
      fr: [
        "Fixation adaptée au support",
        "Raccordement et mise à la terre",
        "Pose de spots encastrés",
        "Évacuation de l'ancien matériel",
      ],
      en: ["Substrate-matched fixing", "Wiring and earthing", "Recessed spot installation", "Old fitting taken away"],
      ar: ["تثبيت مناسب للسند", "الربط والتأريض", "تركيب سبوتات مدمجة", "رفع الجهاز القديم"],
    },
  },
  {
    slug: "recherche-de-panne",
    category: "electricite",
    icon: "scan",
    keywords: ["panne", "ne marche plus", "intermittent", "diagnostic", "عطل", "تشخيص"],
    name: { fr: "Recherche de panne électrique", en: "Electrical fault finding", ar: "البحث عن الأعطال الكهربائية" },
    short: {
      fr: "Panne intermittente ou circuit mort : le défaut est identifié, pas contourné.",
      en: "Intermittent fault or dead circuit: the defect is identified, not bypassed.",
      ar: "عطل متقطع أو دائرة ميتة: يُحدد الخلل ولا يُتجاوز.",
    },
    detail: {
      fr: "Circuit par circuit, appareil par appareil, jusqu'à isoler le défaut. Une panne intermittente est la plus traître : elle est cherchée dans les conditions où elle apparaît, pas seulement à froid.",
      en: "Circuit by circuit, appliance by appliance, until the fault is isolated. An intermittent fault is the trickiest kind: it is chased under the conditions where it shows, not just cold.",
      ar: "دائرة بدائرة وجهازًا بجهاز حتى عزل الخلل. العطل المتقطع هو الأصعب: يُبحث عنه في ظروف ظهوره لا في الحالة الباردة فقط.",
    },
    includes: {
      fr: [
        "Isolement circuit par circuit",
        "Contrôle des appareils raccordés",
        "Mesure et vérification",
        "Explication claire de la cause",
      ],
      en: [
        "Circuit-by-circuit isolation",
        "Connected appliance checks",
        "Measurement and verification",
        "Clear explanation of the cause",
      ],
      ar: ["عزل الدوائر واحدة تلو الأخرى", "مراقبة الأجهزة الموصولة", "القياس والتحقق", "شرح واضح للسبب"],
    },
  },
  {
    slug: "tableau-electrique",
    category: "electricite",
    icon: "panel",
    keywords: ["tableau", "tableau électrique", "coffret", "disjoncteur général", "لوحة كهربائية"],
    name: {
      fr: "Installation de tableaux électriques",
      en: "Consumer unit installation",
      ar: "تركيب اللوحات الكهربائية",
    },
    short: {
      fr: "Le cœur de l'installation : tableau neuf, organisé et repéré.",
      en: "The heart of the installation: a new panel, organised and labelled.",
      ar: "قلب التمديدة: لوحة جديدة منظمة ومرقّمة.",
    },
    detail: {
      fr: "Un tableau vétuste ou surchargé est un risque permanent. Le nouveau tableau répartit les circuits, intègre les protections adaptées et porte un repérage lisible de chaque départ.",
      en: "An old or overloaded panel is a permanent risk. The new one splits circuits properly, carries the right protective devices and labels every way clearly.",
      ar: "اللوحة القديمة أو المحمّلة خطر دائم. اللوحة الجديدة توزع الدوائر وتضم الحمايات المناسبة مع ترقيم واضح لكل خط.",
    },
    includes: {
      fr: [
        "Dépose de l'ancien tableau",
        "Répartition des circuits",
        "Pose des protections adaptées",
        "Repérage lisible et durable",
      ],
      en: ["Old panel removal", "Circuit distribution", "Correct protective devices", "Clear, durable labelling"],
      ar: ["نزع اللوحة القديمة", "توزيع الدوائر", "تركيب الحمايات المناسبة", "ترقيم واضح ودائم"],
    },
  },
  {
    slug: "protections-electriques",
    category: "electricite",
    icon: "shield",
    keywords: ["disjoncteur", "différentiel", "fusible", "protection", "قاطع", "حماية"],
    name: {
      fr: "Remplacement de protections électriques",
      en: "Protective device replacement",
      ar: "تعويض الحمايات الكهربائية",
    },
    short: {
      fr: "Disjoncteurs et différentiels : les organes qui protègent les personnes.",
      en: "Breakers and RCDs: the devices that protect people.",
      ar: "قواطع وحمايات تفاضلية: الأجهزة التي تحمي الأشخاص.",
    },
    detail: {
      fr: "Un différentiel qui ne déclenche plus ne protège plus personne. Les protections sont testées, et celles qui sont hors service ou sous-dimensionnées sont remplacées par des modèles au bon calibre.",
      en: "An RCD that no longer trips protects no one. Devices are tested, and any that are dead or undersized get replaced with correctly rated ones.",
      ar: "الحماية التفاضلية التي لا تفصل لا تحمي أحدًا. تُختبر الحمايات وتُعوَّض المعطلة أو غير المناسبة بأخرى بالمعايرة الصحيحة.",
    },
    includes: {
      fr: [
        "Test des différentiels existants",
        "Remplacement au bon calibre",
        "Contrôle du raccordement",
        "Vérification après pose",
      ],
      en: [
        "Testing existing RCDs",
        "Correctly rated replacement",
        "Connection check",
        "Post-installation verification",
      ],
      ar: ["اختبار الحمايات الموجودة", "التعويض بالمعايرة الصحيحة", "مراقبة الربط", "التحقق بعد التركيب"],
    },
  },
  {
    slug: "eclairage-interieur-exterieur",
    category: "electricite",
    icon: "lamp",
    keywords: ["éclairage", "extérieur", "jardin", "led", "projecteur", "détecteur", "إنارة خارجية"],
    name: {
      fr: "Éclairage intérieur et extérieur",
      en: "Indoor & outdoor lighting",
      ar: "الإنارة الداخلية والخارجية",
    },
    short: {
      fr: "LED, projecteurs, détecteurs de présence : confort et sécurité.",
      en: "LED, floodlights, motion sensors: comfort and security.",
      ar: "LED، كاشفات، حساسات حركة: راحة وأمان.",
    },
    detail: {
      fr: "À l'extérieur, l'étanchéité du matériel et la protection du circuit priment. À l'intérieur, nous privilégions un éclairage LED bien réparti plutôt qu'un point lumineux unique qui écrase la pièce.",
      en: "Outdoors, fitting weatherproofing and circuit protection come first. Indoors, we favour well-distributed LED lighting over a single harsh ceiling point.",
      ar: "في الخارج، إحكام التجهيزات وحماية الدائرة أولوية. في الداخل، نفضل إنارة LED موزعة جيدًا بدل نقطة واحدة قاسية.",
    },
    includes: {
      fr: [
        "Éclairage LED intérieur",
        "Projecteurs extérieurs étanches",
        "Détecteurs de présence",
        "Circuit protégé et adapté",
      ],
      en: [
        "Indoor LED lighting",
        "Weatherproof outdoor floodlights",
        "Motion detectors",
        "Protected, suitable circuit",
      ],
      ar: ["إنارة LED داخلية", "كاشفات خارجية محكمة", "حساسات حركة", "دائرة محمية ومناسبة"],
    },
  },
  {
    slug: "maintenance-electrique",
    category: "electricite",
    icon: "gauge",
    keywords: ["entretien électrique", "contrôle", "vérification", "صيانة كهربائية"],
    name: { fr: "Maintenance électrique", en: "Electrical maintenance", ar: "الصيانة الكهربائية" },
    short: {
      fr: "Contrôle périodique du tableau, des protections et des points d'usage.",
      en: "Periodic checks of the panel, the protections and the outlets.",
      ar: "مراقبة دورية للوحة والحمايات ونقاط الاستعمال.",
    },
    detail: {
      fr: "Le serrage des connexions se relâche avec le temps et la chaleur : c'est une cause classique d'échauffement. Un contrôle périodique reprend les serrages et teste les différentiels.",
      en: "Terminal tightness loosens with time and heat — a classic cause of overheating. A periodic check re-tightens connections and tests the RCDs.",
      ar: "يرتخي شد الوصلات مع الوقت والحرارة، وهو سبب شائع للتسخين. المراقبة الدورية تعيد الشد وتختبر الحمايات.",
    },
    includes: {
      fr: [
        "Reprise du serrage des connexions",
        "Test des différentiels",
        "Contrôle des échauffements",
        "Compte rendu écrit",
      ],
      en: ["Connection re-tightening", "RCD testing", "Overheating checks", "Written report"],
      ar: ["إعادة شد الوصلات", "اختبار الحمايات", "مراقبة التسخين", "تقرير مكتوب"],
    },
  },
  {
    slug: "mise-a-niveau-installation",
    category: "electricite",
    icon: "upgrade",
    keywords: ["mise aux normes", "vétuste", "ancienne installation", "terre", "rénovation", "تحديث", "تأهيل"],
    name: { fr: "Mise à niveau d'installation", en: "Installation upgrade", ar: "تحديث التمديدة" },
    short: {
      fr: "Installation ancienne : mise en sécurité progressive et priorisée.",
      en: "Older installation: a staged, prioritised safety upgrade.",
      ar: "تمديدة قديمة: تأمين تدريجي حسب الأولوية.",
    },
    detail: {
      fr: "Tout refaire d'un coup n'est pas toujours nécessaire. Nous établissons ce qui est dangereux aujourd'hui, ce qui peut attendre, et dans quel ordre traiter — vous décidez du rythme.",
      en: "Redoing everything at once is not always necessary. We set out what is dangerous today, what can wait and in what order to proceed — you set the pace.",
      ar: "ليس من الضروري دائمًا إعادة كل شيء دفعة واحدة. نحدد ما هو خطير اليوم وما يمكن تأجيله وترتيب الأولويات، وأنت تقرر الوتيرة.",
    },
    includes: {
      fr: [
        "État des lieux de l'existant",
        "Priorisation des points dangereux",
        "Mise à la terre et protections",
        "Travaux par étapes possibles",
      ],
      en: [
        "Survey of the existing setup",
        "Danger points prioritised",
        "Earthing and protections",
        "Work possible in stages",
      ],
      ar: ["جرد الوضع الحالي", "ترتيب النقاط الخطرة", "التأريض والحمايات", "إمكانية العمل على مراحل"],
    },
  },
];

export const services: Service[] = [...plumbingServices, ...electricalServices];

export const servicesByCategory: Record<ServiceCategory, Service[]> = {
  plomberie: plumbingServices,
  electricite: electricalServices,
};

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function serviceName(slug: string, locale: Locale): string {
  return getService(slug)?.name[locale] ?? slug;
}

/** Services mis en avant sur la page d'accueil. */
export const featuredSlugs = [
  "reparation-fuite-eau",
  "depannage-electrique",
  "debouchage-canalisation",
  "chauffe-eau",
  "tableau-electrique",
  "recherche-de-fuite",
] as const;
