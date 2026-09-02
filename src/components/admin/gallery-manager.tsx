"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Illustration, illustrationKeys } from "@/components/illustrations";
import { button } from "@/components/ui/button";
import { fr } from "@/lib/i18n/dictionaries/fr";
import type { GalleryItem } from "@/lib/store/types";
import { galleryCategories } from "@/lib/store/types";

/**
 * Gestion de la galerie.
 *
 * Deux façons d'ajouter une réalisation : téléverser une vraie photo de
 * chantier, ou choisir une des illustrations vectorielles fournies. La seconde
 * option permet de garder une galerie présentable dès le premier jour, avant
 * d'avoir constitué une photothèque.
 */
export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"image" | "illustration">("image");
  const [mediaId, setMediaId] = useState("");
  const [preview, setPreview] = useState("");
  const [illustration, setIllustration] = useState(illustrationKeys[0] ?? "faucet-scene");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("scope", "gallery");
    try {
      const response = await fetch("/api/media", { method: "POST", body });
      if (!response.ok) throw new Error("upload");
      const media = (await response.json()) as { id: string };
      setMediaId(media.id);
      setPreview(`/api/media/${media.id}`);
    } catch {
      setError("L'envoi de l'image a échoué (formats acceptés : JPEG, PNG, WebP — 5 Mo maximum).");
    } finally {
      setBusy(false);
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (mode === "image" && !mediaId) {
      setError("Choisissez d'abord une image.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          category: String(form.get("category") ?? "realisations"),
          kind: mode,
          mediaId: mode === "image" ? mediaId : "",
          illustration: mode === "illustration" ? illustration : "",
          published: true,
          order: items.length,
        }),
      });
      if (!response.ok) throw new Error("create");
      event.currentTarget.reset();
      setMediaId("");
      setPreview("");
      router.refresh();
    } catch {
      setError("La création a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cet élément de la galerie ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-aqua-400 focus:outline-none";

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form onSubmit={create} className="h-fit rounded-2xl border border-mist-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Ajouter une réalisation</h2>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["image", "illustration"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                mode === value
                  ? "border-aqua-400 bg-aqua-50 text-aqua-800"
                  : "border-mist-200 text-slate-600 hover:bg-mist-50"
              }`}
            >
              {value === "image" ? "Photo" : "Illustration"}
            </button>
          ))}
        </div>

        {mode === "image" ? (
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-mist-300 bg-mist-50 px-4 py-6 text-center transition hover:border-aqua-400">
            {preview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={preview} alt="" className="h-28 w-full rounded-lg object-cover" />
            ) : (
              <>
                <Icon name="camera" size={22} className="text-aqua-600" />
                <span className="text-sm font-semibold text-ink-900">Choisir une photo</span>
                <span className="text-xs text-slate-500">JPEG, PNG ou WebP — 5 Mo max.</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
        ) : (
          <div className="mt-4">
            <div className="overflow-hidden rounded-xl border border-mist-200">
              <Illustration name={illustration} className="h-32 w-full" />
            </div>
            <select
              value={illustration}
              onChange={(event) => setIllustration(event.target.value)}
              className={`${field} mt-2`}
            >
              {illustrationKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Titre</span>
          <input name="title" required minLength={2} maxLength={120} className={field} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Description</span>
          <textarea name="description" rows={2} maxLength={400} className={`${field} resize-y`} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Catégorie</span>
          <select name="category" className={field} defaultValue="realisations">
            {galleryCategories.map((category) => (
              <option key={category} value={category}>
                {fr.gallery.filters[category]}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

        <button type="submit" disabled={busy} className={button("primary", "md", "mt-4 w-full")}>
          <Icon name="plus" size={16} />
          Ajouter
        </button>
      </form>

      <div className="lg:col-span-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-mist-300 bg-white p-10 text-center text-sm text-slate-500">
            La galerie est vide.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-card">
                <div className="aspect-[4/3] bg-ink-900">
                  {item.kind === "illustration" || !item.mediaId ? (
                    <Illustration name={item.illustration ?? "faucet-scene"} className="h-full w-full" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={`/api/media/${item.mediaId}`} alt={item.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-mist-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-slate-500">
                      {fr.gallery.filters[item.category]}
                    </span>
                  </div>
                  {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void update(item.id, { published: !item.published })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        item.published
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-mist-200 bg-mist-50 text-slate-500"
                      }`}
                    >
                      {item.published ? "Publié" : "Masqué"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(item.id)}
                      className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Icon name="trash" size={13} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
