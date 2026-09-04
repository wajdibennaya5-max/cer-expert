import type { ReactNode } from "react";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
}

/** En-tête de section : même rythme typographique partout sur le site. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center items-center mx-auto" : "text-start items-start";
  return (
    <Reveal className={`flex max-w-3xl flex-col gap-4 ${alignment} ${className}`}>
      {eyebrow ? (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
            tone === "dark" ? "border-white/15 bg-white/5 text-aqua-200" : "border-aqua-200 bg-aqua-50 text-aqua-700"
          }`}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={`text-balance text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.75rem] ${
          tone === "dark" ? "text-white" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`text-pretty text-base leading-relaxed sm:text-lg ${tone === "dark" ? "text-slate-300" : "text-slate-600"}`}
        >
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: "light" | "mist" | "dark";
  /**
   * Rythme vertical réduit, pour un bloc court — une recherche, un rappel.
   *
   * C'est une propriété plutôt qu'une classe passée de l'extérieur : Tailwind
   * départage deux classes concurrentes par leur ordre dans la feuille de
   * style, jamais par l'ordre d'écriture. Un `py-10` ajouté après coup ne
   * l'emporterait donc pas de façon fiable sur le `py-20` de base.
   */
  compact?: boolean;
}

export function Section({ children, id, className = "", tone = "light", compact = false }: SectionProps) {
  const tones = {
    light: "bg-white",
    mist: "bg-mist-50",
    dark: "section-dark",
  } as const;
  const rythme = compact ? "py-10 sm:py-12" : "py-20 sm:py-24 lg:py-28";
  return (
    <section id={id} className={`relative overflow-hidden ${rythme} ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}
