import { Icon } from "@/components/icons";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Settings } from "@/lib/store/types";

/**
 * Présentation du programme de fidélité.
 * Les badges et les paliers affichés viennent des paramètres : ce que voit le
 * visiteur est exactement ce que l'administrateur a configuré.
 */
export function RewardsPreview({ dict, settings }: { dict: Dictionary; settings: Settings }) {
  if (!settings.rewards.enabled) return null;

  return (
    <Section tone="dark">
      <div className="aurora opacity-60" aria-hidden="true" />
      <div className="container-page relative">
        <SectionHeading
          tone="dark"
          eyebrow={dict.client.rewards.title}
          title={dict.rewards.badgesTitle}
          subtitle={dict.rewards.badgesSubtitle}
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {settings.rewards.badges.map((badge, index) => (
            <Reveal key={badge.key} delay={index * 70} className="h-full">
              <div className="glass h-full rounded-3xl p-6 text-center transition hover:border-white/25">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-volt-300/20 to-aqua-400/20 text-3xl">
                  {badge.emoji}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{badge.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{badge.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {settings.rewards.tiers.length > 0 ? (
          <Reveal className="mt-10">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-400/15 text-aqua-300">
                  <Icon name="badge" size={22} />
                </span>
                <p className="text-sm font-semibold text-white">{dict.client.rewards.tier}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.rewards.tiers.map((tier) => (
                  <span
                    key={tier.key}
                    className="rounded-full border border-white/12 bg-ink-900/70 px-4 py-2 text-xs font-semibold text-slate-200"
                  >
                    {tier.label}
                    <span className="ms-2 text-slate-500">{tier.minPoints}+</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
