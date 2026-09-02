/**
 * Fabrique de classes de boutons.
 *
 * Un seul endroit décrit l'apparence de tous les boutons du site : les liens
 * (`<a>`) et les boutons (`<button>`) partagent exactement le même rendu, ce qui
 * évite les divergences visuelles entre un « Appeler » (lien tel:) et un
 * « Envoyer » (bouton de formulaire).
 */

export type ButtonVariant = "primary" | "volt" | "light" | "outline" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "btn-shine inline-flex items-center justify-center gap-2.5 rounded-full font-semibold tracking-tight " +
  "transition-all duration-300 active:scale-[0.97] disabled:opacity-55 disabled:pointer-events-none " +
  "focus-visible:outline-3 focus-visible:outline-offset-3 select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-aqua-300 via-aqua-400 to-aqua-500 text-ink-950 shadow-[0_14px_40px_-14px_rgba(6,170,212,0.85)] hover:shadow-[0_20px_54px_-14px_rgba(6,170,212,0.95)] hover:-translate-y-0.5",
  volt: "bg-gradient-to-r from-volt-300 via-volt-400 to-volt-500 text-ink-950 shadow-[0_14px_40px_-14px_rgba(245,158,11,0.85)] hover:shadow-[0_20px_54px_-14px_rgba(245,158,11,0.95)] hover:-translate-y-0.5",
  light:
    "bg-white text-ink-900 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-14px_rgba(15,23,42,0.5)]",
  outline: "border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/12 hover:border-white/40",
  ghost: "text-ink-900 hover:bg-ink-900/6",
  soft: "bg-aqua-50 text-aqua-800 border border-aqua-200 hover:bg-aqua-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-5 text-[0.9rem]",
  lg: "h-13 px-7 text-[0.95rem] min-h-13",
  xl: "h-15 px-8 text-base min-h-15",
};

export function button(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}
