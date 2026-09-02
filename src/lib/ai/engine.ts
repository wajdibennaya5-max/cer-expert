import { getService, services } from "@/content/services";
import { site } from "@/lib/site";
import { syncClientProfile } from "@/lib/rewards";
import { phoneKey, store } from "@/lib/store";
import type { ServiceCategory } from "@/content/services";
import type { UrgencyLevel } from "@/lib/store/types";
import { classify, detectSafety, firstAid, normalize } from "./knowledge";
import { S, t } from "./strings";
import type { AssistantInput, AssistantState, AssistantTurn, QuickReply } from "./types";

/**
 * Moteur de conversation de l'assistant.
 *
 * C'est une machine à états déterministe : chaque étape pose une question,
 * enregistre la réponse et progresse. Ce choix est volontaire — il garantit
 * qu'une demande complète et exploitable est produite à la fin, sans dépendre
 * d'un service tiers payant, et sans jamais inventer de diagnostic.
 *
 * Un modèle de langage peut être branché par-dessus (voir `provider.ts`) pour
 * reformuler les réponses : la collecte d'informations, elle, reste pilotée
 * par ce moteur.
 */

const INTENTS = {
  plumbing: "intent:plumbing",
  electrical: "intent:electrical",
  emergency: "intent:emergency",
  appointment: "intent:appointment",
  quote: "intent:quote",
  human: "intent:human",
  send: "intent:send",
  restart: "intent:restart",
  skipPhotos: "intent:skip-photos",
  callback: "intent:callback",
} as const;

type Data = Record<string, string>;

function nextState(step: AssistantState["step"], data: Data, category?: string): AssistantState {
  return { step, data, category };
}

function callReply(locale: AssistantInput["locale"], emphasis = true): QuickReply {
  return {
    label: t(S.qrCall, locale),
    value: INTENTS.human,
    action: "call",
    href: `tel:${site.phone.dial}`,
    emphasis,
  };
}

function whatsappReply(locale: AssistantInput["locale"]): QuickReply {
  return {
    label: t(S.qrWhatsapp, locale),
    value: "whatsapp",
    action: "whatsapp",
    href: `https://wa.me/${site.phone.whatsapp}`,
  };
}

function greeting(locale: AssistantInput["locale"]): AssistantTurn {
  return {
    messages: [{ text: t(S.hello, locale) }, { text: t(S.howHelp, locale) }],
    quickReplies: [
      { label: t(S.qrPlumbing, locale), value: INTENTS.plumbing },
      { label: t(S.qrElectrical, locale), value: INTENTS.electrical },
      { label: t(S.qrEmergency, locale), value: INTENTS.emergency, emphasis: true },
      { label: t(S.qrAppointment, locale), value: INTENTS.appointment },
      { label: t(S.qrQuote, locale), value: INTENTS.quote },
      { label: t(S.qrHuman, locale), value: INTENTS.human },
    ],
    state: nextState("greeting", {}),
    input: { type: "text", placeholder: "" },
  };
}

/** Premier tour, sans message du visiteur. */
export function openingTurn(locale: AssistantInput["locale"]): AssistantTurn {
  return greeting(locale);
}

const urgencyMap: Record<string, UrgencyLevel> = {
  now: "emergency",
  today: "urgent",
  week: "normal",
  planned: "planned",
};

function locationOptions(locale: AssistantInput["locale"], category?: string): QuickReply[] {
  const common = [
    { label: t(S.locKitchen, locale), value: t(S.locKitchen, "fr") },
    { label: t(S.locBathroom, locale), value: t(S.locBathroom, "fr") },
    { label: t(S.locWc, locale), value: t(S.locWc, "fr") },
    { label: t(S.locLiving, locale), value: t(S.locLiving, "fr") },
  ];
  const electrical = [{ label: t(S.locPanel, locale), value: t(S.locPanel, "fr") }];
  const tail = [
    { label: t(S.locOutside, locale), value: t(S.locOutside, "fr") },
    { label: t(S.locWhole, locale), value: t(S.locWhole, "fr") },
    { label: t(S.locOther, locale), value: t(S.locOther, "fr") },
  ];
  return category === "electricite" ? [...common, ...electrical, ...tail] : [...common, ...tail];
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function describePrompt(locale: AssistantInput["locale"], data: Data, category?: string) {
  if (data.mode === "quote") return t(S.askDescribeQuote, locale);
  if (data.mode === "appointment") return t(S.askDescribeAppointment, locale);
  if (category === "plomberie") return t(S.askDescribePlumbing, locale);
  if (category === "electricite") return t(S.askDescribeElectrical, locale);
  return t(S.askDescribeGeneric, locale);
}

function askDescribe(locale: AssistantInput["locale"], data: Data, category?: string): AssistantTurn {
  return {
    messages: [{ text: describePrompt(locale, data, category) }],
    quickReplies: [callReply(locale, false)],
    state: nextState("describe", data, category),
    input: { type: "textarea", placeholder: t(S.askDescribeGeneric, locale) },
  };
}

function askLocation(
  locale: AssistantInput["locale"],
  data: Data,
  category: string | undefined,
  before: AssistantTurn["messages"],
): AssistantTurn {
  return {
    messages: [...before, { text: t(S.askLocation, locale) }],
    quickReplies: locationOptions(locale, category),
    state: nextState("location", data, category),
    input: { type: "text" },
  };
}

export async function respond(input: AssistantInput): Promise<AssistantTurn> {
  const locale = input.locale;
  const raw = input.message.trim();
  const state = input.state ?? { step: "greeting", data: {} };
  const data: Data = { ...(state.data ?? {}) };
  let category = state.category;

  if (raw === INTENTS.restart) {
    const turn = greeting(locale);
    turn.messages = [{ text: t(S.restarted, locale) }];
    return turn;
  }
  if (!raw && state.step === "greeting") return greeting(locale);

  /* Détection de danger : prioritaire sur tout le reste du dialogue. */
  const safety = detectSafety(raw);
  const safetyMessages: AssistantTurn["messages"] = [];
  if (safety) {
    safetyMessages.push({ text: safety.message[locale] ?? safety.message.fr, tone: "warning" });
    if (safety.critical) data.urgency = "emergency";
  }

  switch (state.step) {
    /* ---------------------------------------------------------- accueil */
    case "greeting": {
      if (raw === INTENTS.human) {
        return {
          messages: [
            { text: t(S.humanIntro, locale, { phone: site.phone.display }) },
            { text: t(S.humanFallback, locale) },
          ],
          quickReplies: [
            callReply(locale),
            whatsappReply(locale),
            { label: t(S.qrLeaveDetails, locale), value: INTENTS.callback },
          ],
          state: nextState("human", data, category),
          input: { type: "none" },
        };
      }
      if (raw === INTENTS.plumbing) category = "plomberie";
      if (raw === INTENTS.electrical) category = "electricite";
      if (raw === INTENTS.emergency) data.urgency = "emergency";
      if (raw === INTENTS.appointment) data.mode = "appointment";
      if (raw === INTENTS.quote) data.mode = "quote";

      if (Object.values(INTENTS).includes(raw as (typeof INTENTS)[keyof typeof INTENTS])) {
        const turn = askDescribe(locale, data, category);
        if (data.urgency === "emergency") {
          turn.messages.unshift({
            text: t(S.emergencyPush, locale, { phone: site.phone.display }),
            tone: "warning",
          });
          turn.quickReplies = [callReply(locale), ...turn.quickReplies];
        }
        return turn;
      }
      // Texte libre dès le premier message : on le traite comme une description.
      return handleDescription(raw, locale, data, category, safetyMessages);
    }

    /* --------------------------------------------- « parler à quelqu'un » */
    case "human": {
      if (raw === INTENTS.callback) return askDescribe(locale, data, category);
      return handleDescription(raw, locale, data, category, safetyMessages);
    }

    /* ------------------------------------------------------- description */
    case "describe":
      return handleDescription(raw, locale, data, category, safetyMessages);

    /* ---------------------------------------------------------- endroit */
    case "location": {
      data.location = raw.slice(0, 120);
      return {
        messages: [...safetyMessages, { text: t(S.askDuration, locale) }],
        quickReplies: [
          { label: t(S.durToday, locale), value: t(S.durToday, "fr") },
          { label: t(S.durDays, locale), value: t(S.durDays, "fr") },
          { label: t(S.durWeek, locale), value: t(S.durWeek, "fr") },
          { label: t(S.durUnknown, locale), value: t(S.durUnknown, "fr") },
        ],
        state: nextState("duration", data, category),
        input: { type: "text" },
      };
    }

    /* ----------------------------------------------------------- durée */
    case "duration": {
      data.duration = raw.slice(0, 80);
      if (data.urgency === "emergency") {
        return askPhotos(locale, data, category, [
          ...safetyMessages,
          { text: t(S.emergencyPush, locale, { phone: site.phone.display }), tone: "warning" },
        ]);
      }
      return {
        messages: [...safetyMessages, { text: t(S.askUrgency, locale) }],
        quickReplies: [
          { label: t(S.urgNow, locale), value: "urgency:now", emphasis: true },
          { label: t(S.urgToday, locale), value: "urgency:today" },
          { label: t(S.urgWeek, locale), value: "urgency:week" },
          { label: t(S.urgPlanned, locale), value: "urgency:planned" },
        ],
        state: nextState("urgency", data, category),
        input: { type: "none" },
      };
    }

    /* -------------------------------------------------------- urgence */
    case "urgency": {
      const key = raw.startsWith("urgency:") ? raw.slice("urgency:".length) : "";
      data.urgency = urgencyMap[key] ?? "normal";
      const extra: AssistantTurn["messages"] = [...safetyMessages];
      if (data.urgency === "emergency") {
        extra.push({ text: t(S.emergencyPush, locale, { phone: site.phone.display }), tone: "warning" });
      }
      return askPhotos(locale, data, category, extra);
    }

    /* --------------------------------------------------------- photos */
    case "photos": {
      const messages: AssistantTurn["messages"] = [...safetyMessages];
      const count = input.photos?.length ?? 0;
      if (raw !== INTENTS.skipPhotos && count > 0) {
        messages.push({ text: t(S.photosAdded, locale, { count: String(count) }), tone: "success" });
      }
      messages.push({ text: t(S.askName, locale) });
      return {
        messages,
        quickReplies: [],
        state: nextState("name", data, category),
        input: { type: "text", placeholder: t(S.recapName, locale) },
      };
    }

    /* ------------------------------------------------------------ nom */
    case "name": {
      data.name = raw.slice(0, 80);
      return {
        messages: [{ text: t(S.askPhone, locale, { name: data.name.split(" ")[0] ?? "" }) }],
        quickReplies: [],
        state: nextState("phone", data, category),
        input: { type: "tel", placeholder: "+216 ..." },
      };
    }

    /* ------------------------------------------------------- téléphone */
    case "phone": {
      if (!isValidPhone(raw)) {
        return {
          messages: [{ text: t(S.badPhone, locale), tone: "warning" }],
          quickReplies: [],
          state: nextState("phone", data, category),
          input: { type: "tel", placeholder: "+216 ..." },
        };
      }
      data.phone = raw.slice(0, 24);
      const settings = await store.getSettings();
      return {
        messages: [{ text: t(S.askAddress, locale) }],
        quickReplies: settings.areas.slice(0, 6).map((area) => ({ label: area, value: area })),
        state: nextState("address", data, category),
        input: { type: "text", placeholder: t(S.recapArea, locale) },
      };
    }

    /* ---------------------------------------------------------- zone */
    case "address": {
      data.area = raw.slice(0, 120);
      return recap(locale, data, category, input.photos?.length ?? 0);
    }

    /* ------------------------------------------------------ validation */
    case "confirm": {
      if (raw !== INTENTS.send) return recap(locale, data, category, input.photos?.length ?? 0);
      return submit(locale, data, category, input);
    }

    /* ------------------------------------------------------- terminé */
    case "done":
    default: {
      if (raw === INTENTS.restart) return greeting(locale);
      return handleDescription(raw, locale, {}, undefined, safetyMessages);
    }
  }
}

function askPhotos(
  locale: AssistantInput["locale"],
  data: Data,
  category: string | undefined,
  before: AssistantTurn["messages"],
): AssistantTurn {
  return {
    messages: [...before, { text: t(S.askPhotos, locale) }],
    quickReplies: [
      { label: t(S.qrAddPhoto, locale), value: "photo", action: "photo" },
      { label: t(S.qrSkipPhoto, locale), value: INTENTS.skipPhotos },
    ],
    state: nextState("photos", data, category),
    input: { type: "none" },
    allowPhotos: true,
  };
}

function handleDescription(
  raw: string,
  locale: AssistantInput["locale"],
  data: Data,
  category: string | undefined,
  safetyMessages: AssistantTurn["messages"],
): AssistantTurn {
  const text = raw.trim();
  if (normalize(text).length < 6) {
    return {
      messages: [...safetyMessages, { text: t(S.tooShort, locale) }],
      quickReplies: [callReply(locale, false)],
      state: nextState("describe", data, category),
      input: { type: "textarea" },
    };
  }

  data.description = text.slice(0, 1500);
  const suggestion = classify(text);
  const resolvedCategory = (suggestion.service?.category ?? suggestion.category ?? category) as
    ServiceCategory | undefined;

  // Une situation dangereuse relève toujours du dépannage : proposer « pose d'un
  // tableau électrique » à quelqu'un qui sent le brûlé serait absurde.
  const critical = data.urgency === "emergency" && safetyMessages.length > 0;
  const emergencySlug = resolvedCategory === "plomberie" ? "depannage-plomberie" : "depannage-electrique";

  if (critical && resolvedCategory) data.serviceSlug = emergencySlug;
  else if (suggestion.service) data.serviceSlug = suggestion.service.slug;
  else if (resolvedCategory) data.serviceSlug = emergencySlug;

  const intro: AssistantTurn["messages"] = [...safetyMessages];
  const identified = data.serviceSlug ? getService(data.serviceSlug) : undefined;
  if (identified && !critical) {
    intro.push({ text: t(S.identified, locale, { service: identified.name[locale] }) });
  } else if (!critical) {
    intro.push({ text: t(S.noted, locale) });
  }
  if (resolvedCategory && !safetyMessages.length) {
    intro.push({ text: firstAid[resolvedCategory][locale] });
  }

  return askLocation(locale, data, resolvedCategory ?? category, intro);
}

function recap(
  locale: AssistantInput["locale"],
  data: Data,
  category: string | undefined,
  photoCount: number,
): AssistantTurn {
  const service = data.serviceSlug ? getService(data.serviceSlug) : undefined;
  const urgencyLabels: Record<string, string> = {
    emergency: t(S.urgNow, locale),
    urgent: t(S.urgToday, locale),
    normal: t(S.urgWeek, locale),
    planned: t(S.urgPlanned, locale),
  };
  const lines = [
    service ? `• ${t(S.recapService, locale)} : ${service.name[locale]}` : "",
    data.description ? `• ${t(S.recapProblem, locale)} : ${data.description}` : "",
    data.location ? `• ${t(S.recapPlace, locale)} : ${data.location}` : "",
    data.duration ? `• ${t(S.recapSince, locale)} : ${data.duration}` : "",
    data.urgency ? `• ${t(S.recapUrgency, locale)} : ${urgencyLabels[data.urgency] ?? data.urgency}` : "",
    data.name ? `• ${t(S.recapName, locale)} : ${data.name}` : "",
    data.phone ? `• ${t(S.recapPhone, locale)} : ${data.phone}` : "",
    data.area ? `• ${t(S.recapArea, locale)} : ${data.area}` : "",
    photoCount > 0 ? `• ${t(S.recapPhotos, locale)} : ${photoCount}` : "",
  ].filter(Boolean);

  return {
    messages: [{ text: `${t(S.recapTitle, locale)}\n${lines.join("\n")}` }, { text: t(S.confirmQuestion, locale) }],
    quickReplies: [
      { label: t(S.qrSend, locale), value: INTENTS.send, emphasis: true },
      { label: t(S.qrRestart, locale), value: INTENTS.restart },
    ],
    state: nextState("confirm", data, category),
    input: { type: "none" },
  };
}

async function submit(
  locale: AssistantInput["locale"],
  data: Data,
  category: string | undefined,
  input: AssistantInput,
): Promise<AssistantTurn> {
  try {
    const service = data.serviceSlug ? getService(data.serviceSlug) : undefined;
    const resolvedCategory = (service?.category ?? category ?? "autre") as ServiceCategory | "autre";
    const descriptionParts = [
      data.description,
      data.location ? `Emplacement : ${data.location}` : "",
      data.duration ? `Depuis : ${data.duration}` : "",
    ].filter(Boolean);

    const created = await store.createRequest({
      locale,
      source: "assistant",
      customer: {
        name: data.name || "Client",
        phone: data.phone || "",
        phoneKey: phoneKey(data.phone || ""),
        area: data.area || undefined,
      },
      service: {
        slug: service?.slug ?? "autre",
        category: resolvedCategory,
        label: service?.name.fr ?? "Demande générale",
      },
      description: descriptionParts.join("\n"),
      urgency: (data.urgency as UrgencyLevel) || "normal",
      photos: input.photos ?? [],
    });
    await syncClientProfile(created);

    return {
      messages: [
        { text: t(S.submitted, locale), tone: "success" },
        { text: t(S.reference, locale, { reference: created.reference }), tone: "success" },
      ],
      quickReplies: [
        callReply(locale, false),
        { label: t(S.qrTrack, locale), value: "track", action: "link", href: `/${locale}/espace-client` },
        { label: t(S.qrNewRequest, locale), value: INTENTS.restart },
      ],
      state: nextState("done", {}, undefined),
      input: { type: "none" },
      reference: created.reference,
      created: { reference: created.reference, phoneKey: created.customer.phoneKey, name: created.customer.name },
    };
  } catch {
    return {
      messages: [{ text: t(S.submitError, locale, { phone: site.phone.display }), tone: "warning" }],
      quickReplies: [callReply(locale), whatsappReply(locale)],
      state: nextState("confirm", data, category),
      input: { type: "none" },
    };
  }
}

/** Liste des prestations proposables en réponse rapide (utilisée par l'interface). */
export const assistantServiceOptions = services.map((service) => ({
  slug: service.slug,
  category: service.category,
}));
