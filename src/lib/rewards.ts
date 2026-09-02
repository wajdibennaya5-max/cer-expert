import { store } from "@/lib/store";
import type { BadgeRule, ClientProfile, InterventionRequest, Settings } from "@/lib/store/types";

/**
 * Programme de fidélité.
 *
 * Les règles (points, badges, paliers) vivent dans les paramètres modifiables
 * depuis la console d'administration : aucune valeur n'est codée en dur dans
 * l'interface. Aucun avantage financier n'est promis automatiquement — les
 * paliers portent un texte libre défini par l'administrateur.
 */

export function earnedBadges(profile: ClientProfile, rules: BadgeRule[]): BadgeRule[] {
  return rules.filter((rule) => {
    switch (rule.trigger) {
      case "first_request":
        return profile.requestCount >= 1;
      case "requests":
        return profile.requestCount >= rule.threshold;
      case "completed":
        return profile.completedCount >= rule.threshold;
      case "points":
        return profile.points >= rule.threshold;
      default:
        return false;
    }
  });
}

export function currentTier(points: number, settings: Settings) {
  const tiers = [...settings.rewards.tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = tiers[0];
  for (const tier of tiers) if (points >= tier.minPoints) current = tier;
  const next = tiers.find((tier) => tier.minPoints > points);
  return {
    tier: current,
    next,
    progress: next && next.minPoints > 0 ? Math.min(100, Math.round((points / next.minPoints) * 100)) : 100,
  };
}

/** Recalcule intégralement le profil d'un client à partir de ses demandes. */
export async function syncClientProfile(request: InterventionRequest): Promise<ClientProfile> {
  const settings = await store.getSettings();
  const key = request.customer.phoneKey;
  const requests = await store.listRequestsForClient(key);
  const existing = await store.getClient(key);
  const now = new Date().toISOString();

  const completedCount = requests.filter((item) => item.status === "done").length;
  const points = settings.rewards.enabled
    ? requests.length * settings.rewards.pointsPerRequest + completedCount * settings.rewards.pointsPerCompleted
    : 0;

  const profile: ClientProfile = {
    phoneKey: key,
    phone: request.customer.phone,
    name: request.customer.name || existing?.name || "",
    email: request.customer.email ?? existing?.email,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    points,
    requestCount: requests.length,
    completedCount,
    badges: [],
  };
  profile.badges = earnedBadges(profile, settings.rewards.badges).map((badge) => badge.key);
  return store.upsertClient(profile);
}
