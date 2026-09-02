import { Icon } from "@/components/icons";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { currentTier, earnedBadges } from "@/lib/rewards";
import type { ClientProfile, Settings } from "@/lib/store/types";

export function RewardsPanel({
  profile,
  settings,
  dict,
}: {
  profile: ClientProfile | undefined;
  settings: Settings;
  dict: Dictionary;
}) {
  if (!settings.rewards.enabled) {
    return (
      <div className="rounded-3xl border border-mist-200 bg-white p-6 text-sm text-slate-500 shadow-card">
        {dict.client.rewards.disabled}
      </div>
    );
  }

  const points = profile?.points ?? 0;
  const { tier, next, progress } = currentTier(points, settings);
  const earned = profile ? earnedBadges(profile, settings.rewards.badges) : [];
  const earnedKeys = new Set(earned.map((badge) => badge.key));

  return (
    <div className="overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-card">
      <div className="bg-gradient-to-br from-ink-900 to-ink-950 p-6 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-aqua-300">
          <Icon name="badge" size={15} />
          {dict.client.rewards.title}
        </p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-4xl font-extrabold">{points}</span>
          <span className="text-sm text-slate-400">{dict.client.rewards.points}</span>
        </p>

        {tier ? (
          <p className="mt-1 text-sm font-semibold text-volt-300">
            {dict.client.rewards.tier} · {tier.label}
          </p>
        ) : null}
        {tier?.perk ? <p className="mt-1 text-xs text-slate-400">{tier.perk}</p> : null}

        {next ? (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-aqua-400 to-volt-400 transition-all"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
            <p className="mt-2 text-[0.7rem] text-slate-400">
              {dict.client.rewards.nextTier} : {next.label} — {next.minPoints} {dict.client.rewards.points}
            </p>
          </div>
        ) : null}
      </div>

      <div className="p-6">
        <p className="text-sm font-bold text-ink-900">{dict.client.rewards.badges}</p>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {settings.rewards.badges.map((badge) => {
            const unlocked = earnedKeys.has(badge.key);
            return (
              <li
                key={badge.key}
                className={`rounded-2xl border p-3.5 text-center transition ${
                  unlocked ? "border-volt-200 bg-volt-50" : "border-mist-200 bg-mist-50 opacity-60"
                }`}
              >
                <span className={`block text-2xl ${unlocked ? "" : "grayscale"}`}>{badge.emoji}</span>
                <span className="mt-1.5 block text-xs font-bold text-ink-900">{badge.label}</span>
                <span className="mt-0.5 block text-[0.65rem] text-slate-500">
                  {unlocked ? badge.description : dict.client.rewards.locked}
                </span>
              </li>
            );
          })}
        </ul>
        {earned.length === 0 ? <p className="mt-4 text-xs text-slate-500">{dict.client.rewards.noBadges}</p> : null}
      </div>
    </div>
  );
}
