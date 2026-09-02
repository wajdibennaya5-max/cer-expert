/**
 * Micro-bus d'événements pour ouvrir l'assistant depuis n'importe où
 * (barre mobile, bouton du héros, carte de service) sans imposer un contexte
 * React global ni faire remonter l'état jusqu'à la mise en page.
 */
const OPEN_EVENT = "wtsp:assistant:open";

export function openAssistant(seed?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: seed ?? null }));
}

export function onAssistantOpen(handler: (seed: string | null) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => handler((event as CustomEvent<string | null>).detail ?? null);
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}
