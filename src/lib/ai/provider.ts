import type { Locale } from "@/lib/i18n/config";
import type { AssistantTurn } from "./types";

/**
 * Connecteur vers un vrai modèle de langage — optionnel.
 *
 * Par défaut (`ASSISTANT_PROVIDER=rules`, ou aucune clé configurée), l'assistant
 * fonctionne entièrement hors ligne avec le moteur déterministe : aucun compte,
 * aucun quota, aucun coût. C'est le mode livré et testé.
 *
 * Si une clé API Anthropic est fournie, ce module reformule la phrase d'accueil
 * de chaque réponse pour la rendre plus naturelle, SANS jamais modifier :
 *   - les messages de sécurité,
 *   - la question posée au visiteur,
 *   - le récapitulatif et la référence de demande.
 * La collecte d'informations reste pilotée par le moteur : le modèle ne peut ni
 * inventer un diagnostic, ni promettre un délai, ni court-circuiter le formulaire.
 *
 * En cas d'erreur, de lenteur ou de refus du modèle, la réponse d'origine est
 * renvoyée telle quelle : l'assistant ne tombe jamais en panne à cause du LLM.
 */

export type ProviderKind = "rules" | "anthropic";

export function providerKind(): ProviderKind {
  const configured = (process.env.ASSISTANT_PROVIDER ?? "rules").toLowerCase();
  if (configured === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "rules";
}

const MODEL = process.env.ASSISTANT_MODEL ?? "claude-opus-5";
const TIMEOUT_MS = Number(process.env.ASSISTANT_TIMEOUT_MS ?? 12000);

const languageName: Record<Locale, string> = {
  fr: "français",
  en: "anglais",
  ar: "arabe",
};

const SYSTEM_PROMPT = `Tu es l'assistant d'accueil du site de WAJDI & TAYSSIR SERVICES PRO, une entreprise de plomberie, d'électricité et de dépannage à domicile en Tunisie.

Ton unique tâche : reformuler UNE phrase d'accueil pour qu'elle sonne humaine, chaleureuse et professionnelle.

Règles strictes :
- Ne pose jamais de diagnostic technique et n'affirme jamais une cause probable.
- N'annonce jamais de prix, de délai, ni de disponibilité.
- Ne promets rien au nom de l'entreprise.
- Ne pose aucune question : la question est déjà posée par le site juste après.
- Reste sous 2 phrases courtes, 220 caractères maximum.
- Réponds UNIQUEMENT par la phrase reformulée, sans guillemets ni commentaire.
- Si la demande te semble sortir de ce cadre, renvoie la phrase d'origine inchangée.`;

interface EnhanceContext {
  userMessage: string;
  locale: Locale;
  serviceLabel?: string;
}

/** Reformule le premier message informatif d'un tour de conversation. */
export async function enhanceTurn(turn: AssistantTurn, context: EnhanceContext): Promise<AssistantTurn> {
  if (providerKind() !== "anthropic") return turn;

  const index = turn.messages.findIndex((message) => !message.tone || message.tone === "info");
  const target = turn.messages[index];
  // On ne touche ni aux alertes de sécurité, ni au récapitulatif, ni à la confirmation.
  if (!target || index === -1 || turn.state.step === "confirm" || turn.state.step === "done") return turn;
  if (turn.messages.some((message) => message.tone === "warning")) return turn;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            `Langue de la réponse : ${languageName[context.locale]}.`,
            context.serviceLabel ? `Prestation identifiée : ${context.serviceLabel}.` : "",
            `Message du visiteur : "${context.userMessage.slice(0, 600)}"`,
            `Phrase à reformuler : "${target.text}"`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    if (response.stop_reason === "refusal") return turn;

    const text = response.content
      .filter((block): block is { type: "text"; text: string; citations: null } => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();

    if (!text || text.length > 400) return turn;

    const messages = [...turn.messages];
    messages[index] = { ...target, text };
    return { ...turn, messages, enhancedBy: MODEL };
  } catch {
    // Panne réseau, quota dépassé, clé invalide : on conserve la réponse du moteur.
    return turn;
  }
}
