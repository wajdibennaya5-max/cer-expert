import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation";

/**
 * Réponses d'API homogènes.
 *
 * Règle appliquée partout : un message d'erreur destiné au visiteur ne révèle
 * jamais de détail technique (chemin, pile d'appel, requête). Le détail part
 * dans les journaux du serveur, pas dans la réponse HTTP.
 */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function invalid(error: z.ZodError) {
  return NextResponse.json({ error: "Données invalides", fields: fieldErrors(error) }, { status: 422 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Introuvable" }, { status: 404 });
}

export function serverError() {
  return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
}

export function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Trop de requêtes", retryAfter: retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Lecture défensive du corps JSON : un corps illisible ne doit pas lever d'exception. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Journalise côté serveur sans jamais renvoyer le détail au client. */
export function logError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error instanceof Error ? error.message : error);
}
