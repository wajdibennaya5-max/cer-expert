"use client";

import { openAssistant } from "./assistant-bus";

/**
 * Ouvre l'assistant depuis n'importe quel bouton de page (héros, cartes, CTA).
 * Seul ce fragment est envoyé au navigateur : le reste de la page reste
 * rendu côté serveur.
 */
export function AssistantTrigger({
  className,
  children,
  seed,
}: {
  className?: string;
  children: React.ReactNode;
  seed?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => openAssistant(seed)}>
      {children}
    </button>
  );
}
