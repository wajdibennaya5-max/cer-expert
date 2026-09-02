import type { Locale } from "@/lib/i18n/config";
import type { AttachedMedia } from "@/lib/store/types";

export type AssistantStep =
  | "greeting"
  | "describe"
  | "location"
  | "duration"
  | "urgency"
  | "photos"
  | "name"
  | "phone"
  | "address"
  | "confirm"
  | "human"
  | "done";

export interface AssistantState {
  step: AssistantStep;
  category?: string;
  data?: Record<string, string>;
}

export interface QuickReply {
  label: string;
  value: string;
  /** `call` et `whatsapp` déclenchent une action native au lieu d'un message. */
  action?: "message" | "call" | "whatsapp" | "photo" | "link";
  href?: string;
  emphasis?: boolean;
}

export interface AssistantMessage {
  text: string;
  tone?: "info" | "warning" | "success";
}

export interface AssistantTurn {
  messages: AssistantMessage[];
  quickReplies: QuickReply[];
  state: AssistantState;
  /** Type de champ à présenter au visiteur pour sa prochaine réponse. */
  input: { type: "text" | "tel" | "textarea" | "none"; placeholder?: string };
  allowPhotos?: boolean;
  reference?: string;
  /** Renseigné lorsque la réponse a été enrichie par un modèle de langage. */
  enhancedBy?: string;
  /** Usage serveur uniquement : retiré avant l'envoi au navigateur. */
  created?: CreatedRequestInfo;
}

export interface AssistantInput {
  message: string;
  state?: AssistantState;
  photos?: AttachedMedia[];
  locale: Locale;
}

/** Renseigné en interne lorsque le tour de conversation a créé une demande. */
export interface CreatedRequestInfo {
  reference: string;
  phoneKey: string;
  name: string;
}
