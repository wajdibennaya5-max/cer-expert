import type { Locale } from "@/lib/i18n/config";

export type L = Record<Locale, string>;

export function t(entry: L, locale: Locale, values: Record<string, string> = {}): string {
  const template = entry[locale] ?? entry.fr;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/** Tous les textes de l'assistant, en trois langues. */
export const S = {
  hello: {
    fr: "👋 Bonjour et bienvenue chez WAJDI & TAYSSIR SERVICES PRO !",
    en: "👋 Hello and welcome to WAJDI & TAYSSIR SERVICES PRO!",
    ar: "👋 أهلًا بك في وجدي وتيسير سيرفيس برو!",
  },
  howHelp: {
    fr: "Comment pouvons-nous vous aider aujourd'hui ?",
    en: "How can we help you today?",
    ar: "كيف يمكننا مساعدتك اليوم؟",
  },
  qrPlumbing: { fr: "🔧 J'ai un problème de plomberie", en: "🔧 I have a plumbing problem", ar: "🔧 لدي مشكل سباكة" },
  qrElectrical: {
    fr: "⚡ J'ai un problème électrique",
    en: "⚡ I have an electrical problem",
    ar: "⚡ لدي مشكل كهربائي",
  },
  qrEmergency: { fr: "🚨 J'ai besoin d'un dépannage", en: "🚨 I need an emergency call-out", ar: "🚨 أحتاج نجدة" },
  qrAppointment: {
    fr: "📅 Je veux prendre rendez-vous",
    en: "📅 I'd like to book an appointment",
    ar: "📅 أريد موعدًا",
  },
  qrQuote: { fr: "💰 Je veux demander un devis", en: "💰 I'd like a quote", ar: "💰 أريد تسعيرة" },
  qrHuman: {
    fr: "👨‍🔧 Je veux parler à un technicien",
    en: "👨‍🔧 I want to talk to a technician",
    ar: "👨‍🔧 أريد التحدث مع فني",
  },

  askDescribePlumbing: {
    fr: "Décrivez votre problème de plomberie en quelques mots : que constatez-vous exactement ?",
    en: "Describe your plumbing problem in a few words: what exactly are you seeing?",
    ar: "صف مشكل السباكة في بضع كلمات: ما الذي تلاحظه بالضبط؟",
  },
  askDescribeElectrical: {
    fr: "Décrivez votre problème électrique en quelques mots : que constatez-vous exactement ?",
    en: "Describe your electrical problem in a few words: what exactly are you seeing?",
    ar: "صف المشكل الكهربائي في بضع كلمات: ما الذي تلاحظه بالضبط؟",
  },
  askDescribeGeneric: {
    fr: "Expliquez-moi votre besoin en quelques mots, je m'occupe du reste.",
    en: "Tell me what you need in a few words and I'll take care of the rest.",
    ar: "اشرح لي حاجتك في بضع كلمات وأنا أتكفل بالباقي.",
  },
  askDescribeQuote: {
    fr: "Pour préparer un devis, décrivez les travaux souhaités (type, pièce, quantité si vous la connaissez).",
    en: "To prepare a quote, describe the work you need (type, room, quantity if you know it).",
    ar: "لإعداد تسعيرة، صف الأشغال المطلوبة (النوع، الغرفة، الكمية إن عرفتها).",
  },
  askDescribeAppointment: {
    fr: "Très bien. Pour quel type d'intervention souhaitez-vous un rendez-vous ?",
    en: "Very good. What kind of work would you like to book?",
    ar: "حسنًا. ما نوع التدخل الذي تريد موعدًا من أجله؟",
  },
  tooShort: {
    fr: "Quelques mots de plus m'aideraient à bien orienter votre demande. Que se passe-t-il exactement ?",
    en: "A few more words would help me route your request properly. What exactly is happening?",
    ar: "بضع كلمات إضافية تساعدني على توجيه طلبك. ما الذي يحدث بالضبط؟",
  },
  identified: {
    fr: "Compris. Cela correspond à notre prestation « {service} ».",
    en: "Understood. That matches our “{service}” service.",
    ar: "فهمت. هذا يوافق خدمتنا « {service} ».",
  },
  noted: {
    fr: "C'est noté, merci. Un technicien lira votre description en entier.",
    en: "Noted, thank you. A technician will read your full description.",
    ar: "تم التسجيل، شكرًا. سيقرأ الفني وصفك كاملًا.",
  },
  askLocation: {
    fr: "Où se trouve le problème ?",
    en: "Where is the problem located?",
    ar: "أين يوجد المشكل؟",
  },
  askDuration: {
    fr: "Depuis combien de temps cela dure-t-il ?",
    en: "How long has this been going on?",
    ar: "منذ متى وهذا يحدث؟",
  },
  askUrgency: {
    fr: "Est-ce urgent ?",
    en: "Is it urgent?",
    ar: "هل الأمر عاجل؟",
  },
  askPhotos: {
    fr: "Pouvez-vous ajouter une photo ? Cela nous aide beaucoup à préparer le matériel avant de venir.",
    en: "Could you add a photo? It really helps us bring the right parts.",
    ar: "هل يمكنك إضافة صورة؟ هذا يساعدنا كثيرًا على تحضير المعدات.",
  },
  askName: {
    fr: "Parfait. À quel nom dois-je enregistrer la demande ?",
    en: "Perfect. What name should I file the request under?",
    ar: "ممتاز. باسم من أسجل الطلب؟",
  },
  askPhone: {
    fr: "Merci {name}. Quel est votre numéro de téléphone ? C'est par là que le technicien vous rappellera.",
    en: "Thank you {name}. What is your phone number? That's how the technician will call you back.",
    ar: "شكرًا {name}. ما رقم هاتفك؟ عبره سيتصل بك الفني.",
  },
  badPhone: {
    fr: "Ce numéro ne semble pas valide. Pouvez-vous le saisir à nouveau (8 chiffres, ou avec l'indicatif +216) ?",
    en: "That number doesn't look valid. Could you type it again (8 digits, or with the +216 prefix)?",
    ar: "يبدو الرقم غير صحيح. أعد كتابته من فضلك (8 أرقام أو مع المفتاح ‎+216).",
  },
  askAddress: {
    fr: "Dans quelle zone se situe l'intervention ? Une ville ou un quartier suffit à ce stade.",
    en: "Which area is the job in? A town or district is enough at this stage.",
    ar: "في أي منطقة سيكون التدخل؟ تكفي المدينة أو الحي في هذه المرحلة.",
  },
  recapTitle: {
    fr: "Voici le récapitulatif de votre demande :",
    en: "Here is the summary of your request:",
    ar: "إليك ملخص طلبك:",
  },
  recapService: { fr: "Prestation", en: "Service", ar: "الخدمة" },
  recapProblem: { fr: "Problème", en: "Problem", ar: "المشكل" },
  recapPlace: { fr: "Emplacement", en: "Location", ar: "المكان" },
  recapSince: { fr: "Depuis", en: "Since", ar: "منذ" },
  recapUrgency: { fr: "Urgence", en: "Urgency", ar: "الاستعجال" },
  recapName: { fr: "Nom", en: "Name", ar: "الاسم" },
  recapPhone: { fr: "Téléphone", en: "Phone", ar: "الهاتف" },
  recapArea: { fr: "Zone", en: "Area", ar: "المنطقة" },
  recapPhotos: { fr: "Photos", en: "Photos", ar: "الصور" },
  confirmQuestion: {
    fr: "Tout est correct ? J'envoie la demande à l'équipe.",
    en: "Is everything correct? I'll send the request to the team.",
    ar: "هل كل شيء صحيح؟ سأرسل الطلب إلى الفريق.",
  },
  qrSend: { fr: "✅ Envoyer ma demande", en: "✅ Send my request", ar: "✅ أرسل طلبي" },
  qrRestart: { fr: "✏️ Tout recommencer", en: "✏️ Start over", ar: "✏️ إعادة من البداية" },
  qrAddPhoto: { fr: "📎 Ajouter une photo", en: "📎 Add a photo", ar: "📎 إضافة صورة" },
  qrSkipPhoto: { fr: "Continuer sans photo", en: "Continue without a photo", ar: "المتابعة دون صورة" },
  qrCall: { fr: "📞 Appeler maintenant", en: "📞 Call now", ar: "📞 اتصل الآن" },
  qrWhatsapp: { fr: "💬 Écrire sur WhatsApp", en: "💬 Message on WhatsApp", ar: "💬 مراسلة عبر واتساب" },
  qrTrack: { fr: "📋 Suivre ma demande", en: "📋 Track my request", ar: "📋 تتبع طلبي" },
  qrNewRequest: { fr: "➕ Nouvelle demande", en: "➕ New request", ar: "➕ طلب جديد" },

  submitted: {
    fr: "✅ Demande envoyée avec succès ! Notre équipe vous contactera dès que possible.",
    en: "✅ Request sent successfully! Our team will contact you as soon as possible.",
    ar: "✅ تم إرسال الطلب بنجاح! سيتصل بك فريقنا في أقرب وقت.",
  },
  reference: {
    fr: "Votre numéro de référence : {reference}. Conservez-le, il permet de suivre la demande dans l'espace client.",
    en: "Your reference number: {reference}. Keep it — it lets you follow the request in the client area.",
    ar: "رقم مرجعك: {reference}. احتفظ به لمتابعة الطلب في فضاء الحريف.",
  },
  submitError: {
    fr: "Je n'ai pas pu enregistrer la demande. Appelez-nous directement au {phone}, nous prenons le relais immédiatement.",
    en: "I couldn't save the request. Please call us directly on {phone} and we'll take over right away.",
    ar: "لم أتمكن من تسجيل الطلب. اتصل بنا مباشرة على {phone} وسنتكفل بالأمر فورًا.",
  },
  emergencyPush: {
    fr: "Pour une urgence, l'appel reste le plus rapide : {phone}. Je continue quand même à préparer votre demande.",
    en: "For an emergency, calling is fastest: {phone}. I'll keep preparing your request in the meantime.",
    ar: "في الحالات العاجلة، الاتصال أسرع: {phone}. سأواصل تحضير طلبك في نفس الوقت.",
  },
  humanIntro: {
    fr: "Bien sûr. Vous pouvez joindre un technicien directement au {phone}, du lundi au samedi.",
    en: "Of course. You can reach a technician directly on {phone}, Monday to Saturday.",
    ar: "بالتأكيد. يمكنك الاتصال بفني مباشرة على {phone} من الاثنين إلى السبت.",
  },
  humanFallback: {
    fr: "Si vous préférez être rappelé, je peux prendre vos coordonnées et transmettre votre demande.",
    en: "If you'd rather be called back, I can take your details and pass the request on.",
    ar: "إن كنت تفضل أن نتصل بك، يمكنني أخذ معطياتك وتمرير الطلب.",
  },
  qrLeaveDetails: { fr: "📩 Être rappelé", en: "📩 Get a callback", ar: "📩 أن يتم الاتصال بي" },
  disclaimer: {
    fr: "Je suis l'assistant du site : je prépare votre demande, je ne réalise pas de diagnostic à distance. Un professionnel vérifie toujours sur place.",
    en: "I'm the site assistant: I prepare your request, I don't diagnose remotely. A professional always checks on site.",
    ar: "أنا مساعد الموقع: أحضّر طلبك ولا أقوم بتشخيص عن بعد. يتحقق المحترف دائمًا في عين المكان.",
  },
  photosAdded: {
    fr: "{count} photo(s) bien reçue(s).",
    en: "{count} photo(s) received.",
    ar: "تم استلام {count} صورة.",
  },
  restarted: {
    fr: "Nous repartons de zéro. Que puis-je faire pour vous ?",
    en: "Let's start again. What can I do for you?",
    ar: "لنبدأ من جديد. كيف يمكنني مساعدتك؟",
  },

  /* Options de réponse rapide */
  locKitchen: { fr: "Cuisine", en: "Kitchen", ar: "المطبخ" },
  locBathroom: { fr: "Salle de bain", en: "Bathroom", ar: "الحمام" },
  locWc: { fr: "WC", en: "Toilet", ar: "المرحاض" },
  locLiving: { fr: "Séjour / chambre", en: "Living room / bedroom", ar: "الصالون / الغرفة" },
  locPanel: { fr: "Tableau électrique", en: "Consumer unit", ar: "اللوحة الكهربائية" },
  locOutside: { fr: "Extérieur", en: "Outside", ar: "الخارج" },
  locWhole: { fr: "Tout le logement", en: "The whole home", ar: "كامل المسكن" },
  locOther: { fr: "Autre endroit", en: "Somewhere else", ar: "مكان آخر" },

  durToday: { fr: "Depuis aujourd'hui", en: "Since today", ar: "منذ اليوم" },
  durDays: { fr: "Depuis quelques jours", en: "For a few days", ar: "منذ أيام" },
  durWeek: { fr: "Plus d'une semaine", en: "More than a week", ar: "أكثر من أسبوع" },
  durUnknown: { fr: "Je ne sais pas", en: "I'm not sure", ar: "لا أعرف" },

  urgNow: { fr: "🚨 Urgent, maintenant", en: "🚨 Urgent, right now", ar: "🚨 عاجل الآن" },
  urgToday: { fr: "Aujourd'hui ou demain", en: "Today or tomorrow", ar: "اليوم أو غدًا" },
  urgWeek: { fr: "Cette semaine", en: "This week", ar: "هذا الأسبوع" },
  urgPlanned: { fr: "C'est planifié", en: "It's planned", ar: "مبرمج" },
} satisfies Record<string, L>;
