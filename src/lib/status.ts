import type { RequestStatus, UrgencyLevel } from "@/lib/store/types";

/**
 * Codes couleur des statuts, partagés par l'espace client et l'administration.
 * Un statut a la même couleur des deux côtés : le client et le technicien
 * parlent littéralement la même langue visuelle.
 */
export const statusStyles: Record<RequestStatus, { dot: string; chip: string; bar: string; emoji: string }> = {
  received: {
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    bar: "bg-amber-400",
    emoji: "🟡",
  },
  analysis: { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-800 border-sky-200", bar: "bg-sky-500", emoji: "🔵" },
  scheduled: {
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-800 border-violet-200",
    bar: "bg-violet-500",
    emoji: "🟣",
  },
  onsite: {
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-800 border-orange-200",
    bar: "bg-orange-500",
    emoji: "🟠",
  },
  done: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
    emoji: "🟢",
  },
  cancelled: {
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    bar: "bg-slate-400",
    emoji: "⚪",
  },
};

export const urgencyStyles: Record<UrgencyLevel, string> = {
  emergency: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-orange-50 text-orange-700 border-orange-200",
  normal: "bg-sky-50 text-sky-700 border-sky-200",
  planned: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Étapes visibles dans la barre de progression (l'annulation en est exclue). */
export const progressSteps: RequestStatus[] = ["received", "analysis", "scheduled", "onsite", "done"];

export function progressIndex(status: RequestStatus): number {
  const index = progressSteps.indexOf(status);
  return index === -1 ? 0 : index;
}

export function formatDate(value: string, locale = "fr-FR"): string {
  try {
    return new Date(value).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

export function formatDateTime(value: string, locale = "fr-FR"): string {
  try {
    return new Date(value).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
