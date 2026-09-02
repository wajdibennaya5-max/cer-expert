import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Authentification.
 *
 * - Console d'administration : identifiant + mot de passe définis par variables
 *   d'environnement, session signée (HMAC-SHA256) dans un cookie HttpOnly.
 * - Espace client : accès par référence de demande + numéro de téléphone,
 *   matérialisé par une session signée elle aussi. Pas de mot de passe à
 *   retenir pour le client, et aucune donnée sensible dans le cookie.
 *
 * Aucun secret n'est jamais transmis au navigateur : le cookie ne contient
 * qu'une charge utile signée, vérifiable uniquement côté serveur.
 */

const ADMIN_COOKIE = "wtsp_admin";
const CLIENT_COOKIE = "wtsp_client";
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;
const CLIENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Secret de signature. En développement, une valeur de repli permet de travailler sans configuration. */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  return "developpement-uniquement-definir-SESSION_SECRET-en-production";
}

export function isSessionSecretConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && (process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD));
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

interface SessionPayload {
  sub: string;
  role: "admin" | "client";
  name?: string;
  exp: number;
}

function signToken(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ mots de passe */

/**
 * Format stocké : `scrypt:<sel hex>:<empreinte hex>`.
 *
 * Le séparateur est un deux-points, jamais un dollar : le lecteur de fichiers
 * `.env` de Next.js interprète `$xxx` comme une variable à substituer. Une
 * empreinte contenant des dollars était donc tronquée au chargement — et
 * seulement quand le sel commençait par une lettre, ce qui rendait la panne
 * intermittente et incompréhensible.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Les empreintes générées avant la correction utilisent « $ » : elles
  // restent acceptées, personne n'a à refaire son mot de passe sans raison.
  const parts = stored.includes(":") ? stored.split(":") : stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1]!, "hex");
    const expected = Buffer.from(parts[2]!, "hex");
    const derived = scryptSync(password, salt, expected.length);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Identifiants d'administration.
 * Priorité à `ADMIN_PASSWORD_HASH` (aucun mot de passe en clair dans l'environnement).
 * À défaut, `ADMIN_PASSWORD` est accepté pour un premier démarrage.
 * Sans aucune configuration, un compte de développement `admin / admin` est
 * actif et signalé en évidence dans la console.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  if (!safeEqual(username.trim().toLowerCase(), expectedUser.trim().toLowerCase())) return false;

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyPassword(password, hash);

  const plain = process.env.ADMIN_PASSWORD ?? "admin";
  return safeEqual(password, plain);
}

/* ---------------------------------------------------------------------- sessions */

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

export async function startAdminSession(username: string): Promise<void> {
  const jar = await cookies();
  jar.set(
    ADMIN_COOKIE,
    signToken({ sub: username, role: "admin", exp: Date.now() + ADMIN_TTL_MS }),
    cookieOptions(ADMIN_TTL_MS),
  );
}

export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const payload = verifyToken(jar.get(ADMIN_COOKIE)?.value);
  return payload?.role === "admin" ? payload : null;
}

export async function startClientSession(key: string, name: string): Promise<void> {
  const jar = await cookies();
  jar.set(
    CLIENT_COOKIE,
    signToken({ sub: key, role: "client", name, exp: Date.now() + CLIENT_TTL_MS }),
    cookieOptions(CLIENT_TTL_MS),
  );
}

export async function endClientSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(CLIENT_COOKIE);
}

export async function getClientSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const payload = verifyToken(jar.get(CLIENT_COOKIE)?.value);
  return payload?.role === "client" ? payload : null;
}

/** Vérifie l'accès administrateur depuis une route d'API. */
export async function requireAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
