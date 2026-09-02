/**
 * Limitation d'abus simple, en mémoire.
 *
 * Objectif : empêcher qu'un formulaire public soit envoyé en boucle depuis une
 * même adresse. C'est une protection de bon sens, pas un pare-feu : elle est
 * propre à chaque instance du serveur et se réinitialise au redémarrage.
 * Pour un déploiement multi-instances, brancher un compteur partagé (Redis…).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED) {
    for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
    if (buckets.size > MAX_TRACKED) buckets.clear();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Identifie l'appelant derrière un proxy (Vercel, Nginx, Cloudflare…). */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "local";
}
