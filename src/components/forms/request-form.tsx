"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { button } from "@/components/ui/button";
import { categories, services } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { site, telHref } from "@/lib/site";
import { interventionRequestSchema } from "@/lib/validation";
import { MAX_UPLOAD_BYTES } from "@/lib/media";
import { PhoneText } from "@/components/ui/phone-text";
import { WELCOME_SEEN_KEY } from "@/components/site/welcome-bonus";

interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
}

const urgencyKeys = ["emergency", "urgent", "normal", "planned"] as const;

export function RequestForm({ locale, dict, areas }: { locale: Locale; dict: Dictionary; areas: string[] }) {
  const searchParams = useSearchParams();
  const [serviceSlug, setServiceSlug] = useState("autre");
  const [urgency, setUrgency] = useState<(typeof urgencyKeys)[number]>("normal");
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reference, setReference] = useState("");
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  /*
   * Amener la confirmation à l'écran une fois la demande envoyée.
   *
   * Un simple retour en haut de page ne suffit pas sur mobile : l'en-tête de
   * la page occupe tout l'écran, et le client voyait le formulaire disparaître
   * sans jamais apercevoir son numéro de référence — de quoi croire que rien
   * ne s'était passé, et envoyer la demande une seconde fois.
   */
  useEffect(() => {
    if (status !== "sent") return;
    confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status]);
  const [formError, setFormError] = useState("");

  // Pré-sélection depuis une carte de service : /demande?service=chauffe-eau
  useEffect(() => {
    const preset = searchParams?.get("service");
    if (preset && services.some((service) => service.slug === preset)) setServiceSlug(preset);
    const presetUrgency = searchParams?.get("urgence");
    if (presetUrgency && urgencyKeys.includes(presetUrgency as (typeof urgencyKeys)[number])) {
      setUrgency(presetUrgency as (typeof urgencyKeys)[number]);
    }
  }, [searchParams]);

  const grouped = useMemo(
    () => ({
      plomberie: services.filter((service) => service.category === "plomberie"),
      electricite: services.filter((service) => service.category === "electricite"),
    }),
    [],
  );

  const today = new Date().toISOString().slice(0, 10);

  async function uploadPhotos(files: File[]) {
    if (files.length === 0) return;
    if (photos.length + files.length > 5) {
      setErrors((current) => ({ ...current, photos: dict.request.errors.photoCount }));
      return;
    }
    setUploading(true);
    const added: Attachment[] = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setErrors((current) => ({ ...current, photos: dict.request.errors.photoSize }));
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/api/media", { method: "POST", body });
        if (!response.ok) throw new Error("upload");
        added.push((await response.json()) as Attachment);
      } catch {
        setErrors((current) => ({ ...current, photos: dict.request.errors.photoUpload }));
      }
    }
    if (added.length > 0) {
      setPhotos((current) => [...current, ...added]);
      setErrors((current) => {
        const next = { ...current };
        delete next.photos;
        return next;
      });
    }
    setUploading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      serviceSlug,
      description: String(form.get("description") ?? "").trim(),
      urgency,
      address: String(form.get("address") ?? "").trim(),
      area: String(form.get("area") ?? "").trim(),
      preferredDate: String(form.get("preferredDate") ?? "").trim(),
      preferredTime: String(form.get("preferredTime") ?? "").trim(),
      photos,
      locale,
      source: "form" as const,
      company: String(form.get("company") ?? ""),
    };

    // Première validation dans le navigateur : retour immédiat, sans aller-retour réseau.
    const parsed = interventionRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldMap[key]) fieldMap[key] = issue.message;
      }
      setErrors(fieldMap);
      const firstKey = Object.keys(fieldMap)[0];
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    setErrors({});
    setFormError("");
    setStatus("sending");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as {
        reference?: string;
        error?: string;
        fields?: Record<string, string>;
      } | null;

      if (response.status === 429) {
        setStatus("error");
        setFormError(dict.request.errors.rateLimited);
        return;
      }
      if (!response.ok || !data?.reference) {
        if (data?.fields) setErrors(data.fields);
        setStatus("error");
        setFormError(dict.request.errors.generic);
        return;
      }

      setReference(data.reference);
      // Le visiteur vient de faire ce que l'invitation lui proposait : elle
      // n'a plus de raison de s'afficher, sur cette page ni sur les suivantes.
      try {
        localStorage.setItem(WELCOME_SEEN_KEY, "1");
      } catch {
        /* sans conséquence */
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setFormError(dict.request.errors.generic);
    }
  }

  /* ------------------------------------------------------------ succès */

  if (status === "sent") {
    return (
      <div
        ref={confirmationRef}
        // `scroll-mt-32` réserve la hauteur de l'en-tête fixe : sans elle, le
        // titre de la confirmation se retrouve caché dessous.
        className="mx-auto max-w-2xl scroll-mt-32 rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-card sm:p-12"
      >
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_16px_40px_-12px_rgba(16,185,129,0.7)]">
          <Icon name="check" size={40} />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold text-ink-900 sm:text-3xl">{dict.request.success.title}</h2>
        <p className="mt-3 text-base text-slate-600">{dict.request.success.text}</p>

        <div className="mt-7 rounded-2xl border border-dashed border-aqua-300 bg-aqua-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-aqua-700">
            {dict.request.success.referenceLabel}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-900">{reference}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">{dict.request.success.keep}</p>
        </div>

        {urgency === "emergency" ? (
          <p className="mt-5 flex items-start gap-2 rounded-2xl border border-volt-300 bg-volt-50 p-4 text-start text-sm text-volt-800">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            {dict.request.success.urgentReminder}
          </p>
        ) : null}

        {/*
          Signalement WhatsApp, facultatif.
          La demande est déjà enregistrée ; ce bouton ne sert qu'à prévenir
          l'artisan sans délai, sur le canal qu'il consulte réellement. Il ne
          demande aucun service tiers, aucune clé, et fonctionne même si le
          serveur s'arrête juste après. La référence part avec le message : elle
          suffit à retrouver la demande dans la console.
        */}
        <a
          href={`https://wa.me/${site.phone.whatsapp}?text=${encodeURIComponent(
            `${dict.request.success.whatsappMessage} ${reference}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-emerald-800 sm:w-auto"
        >
          <Icon name="whatsapp" size={19} />
          {dict.request.success.whatsapp}
        </a>
        <p className="mt-2 text-xs text-slate-500">{dict.request.success.whatsappHint}</p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={telHref} className={button("volt", "lg")}>
            <Icon name="phone" size={18} />
            <PhoneText />
          </a>
          <Link href={localePath(locale, "espace-client")} className={button("primary", "lg")}>
            {dict.request.success.track}
          </Link>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setPhotos([]);
              setReference("");
            }}
            className={button("ghost", "lg", "border border-mist-200")}
          >
            {dict.request.success.newRequest}
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- formulaire */

  const field =
    "w-full rounded-2xl border border-mist-200 bg-white px-4 py-3.5 text-[0.95rem] text-ink-900 shadow-sm transition placeholder:text-slate-400 focus:border-aqua-400 focus:outline-none focus:ring-4 focus:ring-aqua-100";
  const label = "mb-1.5 block text-sm font-semibold text-ink-900";

  function ErrorText({ name }: { name: string }) {
    if (!errors[name]) return null;
    return (
      <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
        <Icon name="alert" size={13} />
        {errors[name]}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl space-y-6">
      {/* ---------------------------------------------------- coordonnées */}
      <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
        <fieldset>
          <legend className="flex items-center gap-2.5 text-base font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-aqua-500 text-white">
              <Icon name="user" size={17} />
            </span>
            {dict.request.sectionContact}
          </legend>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={label}>
                {dict.request.fields.name} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                placeholder={dict.request.fields.namePlaceholder}
                className={field}
                aria-invalid={Boolean(errors.name)}
              />
              <ErrorText name="name" />
            </div>
            <div>
              <label htmlFor="phone" className={label}>
                {dict.request.fields.phone} <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                placeholder={dict.request.fields.phonePlaceholder}
                className={field}
                aria-invalid={Boolean(errors.phone)}
              />
              <ErrorText name="phone" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className={label}>
                {dict.request.fields.email}{" "}
                <span className="font-normal text-slate-500">({dict.request.optional})</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={dict.request.fields.emailPlaceholder}
                className={field}
                aria-invalid={Boolean(errors.email)}
              />
              <ErrorText name="email" />
            </div>
          </div>
        </fieldset>
      </div>

      {/* --------------------------------------------------------- besoin */}
      <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
        <fieldset>
          <legend className="flex items-center gap-2.5 text-base font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-volt-500 text-white">
              <Icon name="wrench" size={17} />
            </span>
            {dict.request.sectionProblem}
          </legend>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="serviceSlug" className={label}>
                {dict.request.fields.service} <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceSlug"
                name="serviceSlug"
                value={serviceSlug}
                onChange={(event) => setServiceSlug(event.target.value)}
                className={field}
              >
                <option value="autre">{dict.request.fields.serviceOther}</option>
                <optgroup label={categories.plomberie.label[locale]}>
                  {grouped.plomberie.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.name[locale]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={categories.electricite.label[locale]}>
                  {grouped.electricite.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.name[locale]}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ErrorText name="serviceSlug" />
            </div>

            <div>
              <label htmlFor="description" className={label}>
                {dict.request.fields.description} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={5}
                maxLength={2000}
                placeholder={dict.request.fields.descriptionPlaceholder}
                className={`${field} resize-y`}
                aria-invalid={Boolean(errors.description)}
              />
              <ErrorText name="description" />
            </div>

            <div>
              <span className={label}>
                {dict.request.fields.urgency} <span className="text-red-500">*</span>
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {urgencyKeys.map((key) => {
                  const selected = urgency === key;
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                        selected
                          ? key === "emergency"
                            ? "border-red-400 bg-red-50"
                            : "border-aqua-400 bg-aqua-50"
                          : "border-mist-200 bg-white hover:border-mist-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={key}
                        checked={selected}
                        onChange={() => setUrgency(key)}
                        className="mt-1 h-4 w-4 accent-aqua-500"
                      />
                      <span>
                        <span className="block text-sm font-bold text-ink-900">{dict.request.urgency[key]}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {dict.request.urgency[`${key}Hint` as keyof typeof dict.request.urgency]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {urgency === "emergency" ? (
              <p className="flex items-start gap-2.5 rounded-2xl border border-volt-300 bg-volt-50 p-4 text-sm text-volt-800">
                <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
                <span>
                  {dict.emergency.text}{" "}
                  <a href={telHref} className="font-bold underline underline-offset-2">
                    <PhoneText />
                  </a>
                </span>
              </p>
            ) : null}

            <div>
              <span className={label}>
                {dict.request.fields.photos}{" "}
                <span className="font-normal text-slate-500">({dict.request.optional})</span>
              </span>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-mist-300 bg-mist-50 px-4 py-7 text-center transition hover:border-aqua-400 hover:bg-aqua-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-aqua-600 shadow-sm">
                  <Icon name="camera" size={21} />
                </span>
                <span className="text-sm font-semibold text-ink-900">{dict.request.fields.addPhotos}</span>
                <span className="text-xs text-slate-500">{dict.request.fields.photosHint}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = "";
                    void uploadPhotos(files);
                  }}
                />
              </label>
              {uploading ? <p className="mt-2 text-xs text-slate-500">{dict.common.loading}</p> : null}
              <ErrorText name="photos" />

              {photos.length > 0 ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <li key={photo.id} className="group relative overflow-hidden rounded-2xl border border-mist-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/media/${photo.id}`}
                        alt={photo.name}
                        className="h-24 w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
                        aria-label={`${dict.request.fields.removePhoto} ${photo.name}`}
                        className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/70 text-white transition hover:bg-red-600"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </fieldset>
      </div>

      {/* ---------------------------------------------------- quand et où */}
      <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-card sm:p-8">
        <fieldset>
          <legend className="flex items-center gap-2.5 text-base font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-900 text-white">
              <Icon name="calendar" size={17} />
            </span>
            {dict.request.sectionWhen}
          </legend>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="area" className={label}>
                {dict.request.fields.area}
              </label>
              <select id="area" name="area" className={field} defaultValue="">
                <option value="">{dict.request.fields.areaPlaceholder}</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="address" className={label}>
                {dict.request.fields.address}{" "}
                <span className="font-normal text-slate-500">({dict.request.optional})</span>
              </label>
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                placeholder={dict.request.fields.addressPlaceholder}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="preferredDate" className={label}>
                {dict.request.fields.date}{" "}
                <span className="font-normal text-slate-500">({dict.request.optional})</span>
              </label>
              <input id="preferredDate" name="preferredDate" type="date" min={today} className={field} />
            </div>
            <div>
              <label htmlFor="preferredTime" className={label}>
                {dict.request.fields.time}{" "}
                <span className="font-normal text-slate-500">({dict.request.optional})</span>
              </label>
              <input id="preferredTime" name="preferredTime" type="time" className={field} />
            </div>
          </div>
        </fieldset>
      </div>

      {/* Champ piège anti-robot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Société
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-xs text-slate-500">
          <span className="text-red-500">*</span> {dict.request.required}
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a href={telHref} className={button("light", "lg", "border border-mist-200")}>
            <Icon name="phone" size={18} />
            {dict.cta.callNow}
          </a>
          <button type="submit" disabled={status === "sending"} className={button("primary", "lg", "min-w-52")}>
            {status === "sending" ? dict.cta.sending : dict.request.submit}
            {status === "sending" ? null : <Icon name="send" size={17} />}
          </button>
        </div>
      </div>
    </form>
  );
}
