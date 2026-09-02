"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import type { BadgeRule, RewardTier, Settings } from "@/lib/store/types";

/**
 * Paramètres du site.
 *
 * Tout ce qui est modifiable sans redéploiement est ici : zones d'intervention,
 * bandeau d'annonce, avis d'exemple et règles du programme de fidélité. Les
 * règles de fidélité sont éditables ligne par ligne — c'est ce qui permet à
 * l'entreprise de changer ses avantages sans qu'aucune promesse ne soit figée
 * dans le code.
 */
export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [state, setState] = useState<Settings>(settings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [areaDraft, setAreaDraft] = useState("");

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: state.areas,
          announcement: state.announcement,
          showSampleReviews: state.showSampleReviews,
          rewards: state.rewards,
        }),
      });
      if (!response.ok) throw new Error("save");
      setStatus("saved");
      router.refresh();
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  function updateRewards<K extends keyof Settings["rewards"]>(key: K, value: Settings["rewards"][K]) {
    setState((current) => ({ ...current, rewards: { ...current.rewards, [key]: value } }));
  }

  function updateBadge(index: number, patch: Partial<BadgeRule>) {
    updateRewards(
      "badges",
      state.rewards.badges.map((badge, position) => (position === index ? { ...badge, ...patch } : badge)),
    );
  }

  function updateTier(index: number, patch: Partial<RewardTier>) {
    updateRewards(
      "tiers",
      state.rewards.tiers.map((tier, position) => (position === index ? { ...tier, ...patch } : tier)),
    );
  }

  const field =
    "w-full rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-aqua-400 focus:outline-none";
  const panel = "rounded-2xl border border-mist-200 bg-white p-5 shadow-card";

  return (
    <div className="space-y-5 pb-24">
      <section className={panel}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Zones d&apos;intervention</h2>
        <p className="mt-1 text-xs text-slate-400">
          Affichées dans le pied de page, la page contact et le formulaire.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {state.areas.map((area, index) => (
            <li
              key={`${area}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-mist-200 bg-mist-50 px-3 py-1.5 text-sm"
            >
              {area}
              <button
                type="button"
                aria-label={`Retirer ${area}`}
                onClick={() =>
                  setState((current) => ({ ...current, areas: current.areas.filter((_, i) => i !== index) }))
                }
                className="text-slate-400 transition hover:text-red-600"
              >
                <Icon name="close" size={13} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = areaDraft.trim();
            if (!value || state.areas.includes(value)) return;
            setState((current) => ({ ...current, areas: [...current.areas, value] }));
            setAreaDraft("");
          }}
        >
          <input
            value={areaDraft}
            onChange={(event) => setAreaDraft(event.target.value)}
            maxLength={60}
            placeholder="Ajouter une ville ou un quartier"
            className={field}
          />
          <button type="submit" className="shrink-0 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white">
            <Icon name="plus" size={16} />
          </button>
        </form>
      </section>

      <section className={panel}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Bandeau d&apos;annonce</h2>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={state.announcement.enabled}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                announcement: { ...current.announcement, enabled: event.target.checked },
              }))
            }
            className="h-4 w-4 accent-aqua-500"
          />
          <span className="text-sm font-medium text-ink-900">Afficher le bandeau en haut du site</span>
        </label>
        <input
          value={state.announcement.text}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              announcement: { ...current.announcement, text: event.target.value },
            }))
          }
          maxLength={200}
          className={`${field} mt-3`}
        />
      </section>

      <section className={panel}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Avis</h2>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={state.showSampleReviews}
            onChange={(event) => setState((current) => ({ ...current, showSampleReviews: event.target.checked }))}
            className="mt-1 h-4 w-4 accent-aqua-500"
          />
          <span>
            <span className="block text-sm font-medium text-ink-900">Afficher les avis d&apos;exemple</span>
            <span className="block text-xs text-slate-500">
              Décochez dès que vous avez publié de vrais témoignages : les exemples disparaissent du site.
            </span>
          </span>
        </label>
      </section>

      <section className={panel}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Programme de fidélité</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
            <input
              type="checkbox"
              checked={state.rewards.enabled}
              onChange={(event) => updateRewards("enabled", event.target.checked)}
              className="h-4 w-4 accent-aqua-500"
            />
            Activé
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Points par demande</span>
            <input
              type="number"
              min={0}
              max={1000}
              value={state.rewards.pointsPerRequest}
              onChange={(event) => updateRewards("pointsPerRequest", Number(event.target.value))}
              className={field}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">
              Points par intervention terminée
            </span>
            <input
              type="number"
              min={0}
              max={1000}
              value={state.rewards.pointsPerCompleted}
              onChange={(event) => updateRewards("pointsPerCompleted", Number(event.target.value))}
              className={field}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Points par avis</span>
            <input
              type="number"
              min={0}
              max={1000}
              value={state.rewards.pointsPerReview}
              onChange={(event) => updateRewards("pointsPerReview", Number(event.target.value))}
              className={field}
            />
          </label>
        </div>

        <div className="mt-5 border-t border-mist-100 pt-5">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={state.rewards.welcomeEnabled}
              onChange={(event) => updateRewards("welcomeEnabled", event.target.checked)}
              className="h-4 w-4 accent-aqua-500"
            />
            <span className="text-sm font-medium text-ink-900">Message de bienvenue au premier passage</span>
          </label>
          <input
            value={state.rewards.welcomeTitle}
            onChange={(event) => updateRewards("welcomeTitle", event.target.value)}
            maxLength={80}
            placeholder="Titre"
            className={`${field} mt-3`}
          />
          <textarea
            value={state.rewards.welcomeText}
            onChange={(event) => updateRewards("welcomeText", event.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Texte du message"
            className={`${field} mt-2 resize-y`}
          />
        </div>

        <div className="mt-5 border-t border-mist-100 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Badges</h3>
          <ul className="mt-3 space-y-3">
            {state.rewards.badges.map((badge, index) => (
              <li
                key={badge.key}
                className="grid gap-2 rounded-xl border border-mist-200 bg-mist-50 p-3 sm:grid-cols-12"
              >
                <input
                  value={badge.emoji}
                  onChange={(event) => updateBadge(index, { emoji: event.target.value })}
                  maxLength={4}
                  className={`${field} sm:col-span-1 text-center`}
                />
                <input
                  value={badge.label}
                  onChange={(event) => updateBadge(index, { label: event.target.value })}
                  maxLength={60}
                  className={`${field} sm:col-span-3`}
                />
                <input
                  value={badge.description}
                  onChange={(event) => updateBadge(index, { description: event.target.value })}
                  maxLength={200}
                  className={`${field} sm:col-span-5`}
                />
                <select
                  value={badge.trigger}
                  onChange={(event) => updateBadge(index, { trigger: event.target.value as BadgeRule["trigger"] })}
                  className={`${field} sm:col-span-2`}
                >
                  <option value="first_request">1re demande</option>
                  <option value="requests">Nb demandes</option>
                  <option value="completed">Nb terminées</option>
                  <option value="points">Points</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={badge.threshold}
                  onChange={(event) => updateBadge(index, { threshold: Number(event.target.value) })}
                  className={`${field} sm:col-span-1`}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 border-t border-mist-100 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Paliers</h3>
          <p className="mt-1 text-xs text-slate-400">
            L&apos;avantage est un texte libre : n&apos;annoncez que ce que vous pouvez tenir.
          </p>
          <ul className="mt-3 space-y-3">
            {state.rewards.tiers.map((tier, index) => (
              <li
                key={tier.key}
                className="grid gap-2 rounded-xl border border-mist-200 bg-mist-50 p-3 sm:grid-cols-12"
              >
                <input
                  value={tier.label}
                  onChange={(event) => updateTier(index, { label: event.target.value })}
                  maxLength={60}
                  className={`${field} sm:col-span-3`}
                />
                <input
                  type="number"
                  min={0}
                  value={tier.minPoints}
                  onChange={(event) => updateTier(index, { minPoints: Number(event.target.value) })}
                  className={`${field} sm:col-span-2`}
                />
                <input
                  value={tier.perk}
                  onChange={(event) => updateTier(index, { perk: event.target.value })}
                  maxLength={200}
                  className={`${field} sm:col-span-7`}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mist-200 bg-white/95 px-5 py-3 backdrop-blur-xl sm:px-8">
        <div className="flex items-center justify-end gap-3">
          {status === "saved" ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <Icon name="check" size={16} />
              Enregistré
            </span>
          ) : null}
          {status === "error" ? (
            <span className="text-sm font-semibold text-red-600">Échec de l&apos;enregistrement</span>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={status === "saving"}
            className={button("primary", "md")}
          >
            {status === "saving" ? "Enregistrement…" : "Enregistrer les paramètres"}
          </button>
        </div>
      </div>
    </div>
  );
}
