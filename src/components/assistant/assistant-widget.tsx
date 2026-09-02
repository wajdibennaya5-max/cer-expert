"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref, whatsappHref } from "@/lib/site";
import { onAssistantOpen } from "./assistant-bus";

interface QuickReply {
  label: string;
  value: string;
  action?: "message" | "call" | "whatsapp" | "photo" | "link";
  href?: string;
  emphasis?: boolean;
}

interface Bubble {
  id: string;
  role: "bot" | "user";
  text: string;
  tone?: "info" | "warning" | "success";
}

interface AssistantState {
  step: string;
  category?: string;
  data?: Record<string, string>;
}

interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
}

interface Turn {
  messages: { text: string; tone?: "info" | "warning" | "success" }[];
  quickReplies: QuickReply[];
  state: AssistantState;
  input: { type: "text" | "tel" | "textarea" | "none"; placeholder?: string };
  allowPhotos?: boolean;
  reference?: string;
  enhancedBy?: string;
}

const STORAGE_KEY = "wtsp.assistant.v1";
const TEASER_KEY = "wtsp.assistant.teaser";

let bubbleCounter = 0;
function nextId(): string {
  bubbleCounter += 1;
  return `b${bubbleCounter}-${Date.now().toString(36)}`;
}

export function AssistantWidget({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [state, setState] = useState<AssistantState>({ step: "greeting", data: {} });
  const [inputMode, setInputMode] = useState<Turn["input"]>({ type: "text" });
  const [allowPhotos, setAllowPhotos] = useState(false);
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* --------------------------------------------------- ouverture / état */

  useEffect(() => onAssistantOpen(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) return;
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, "seen");
    } catch {
      /* stockage indisponible : sans conséquence */
    }
  }, [open]);

  // Bulle d'invitation discrète, une seule fois par session.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(TEASER_KEY) === "seen";
    } catch {
      seen = true;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setTeaser(true), 14000);
    return () => window.clearTimeout(timer);
  }, []);

  // Reprise de la conversation en cours lors d'un changement de page.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        bubbles: Bubble[];
        state: AssistantState;
        quickReplies: QuickReply[];
        input: Turn["input"];
        photos: Attachment[];
      };
      if (saved.bubbles?.length) {
        setBubbles(saved.bubbles);
        setState(saved.state);
        setQuickReplies(saved.quickReplies ?? []);
        setInputMode(saved.input ?? { type: "text" });
        setPhotos(saved.photos ?? []);
        setBooted(true);
      }
    } catch {
      /* conversation non restaurée : on repartira de l'accueil */
    }
  }, []);

  useEffect(() => {
    if (!booted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ bubbles, state, quickReplies, input: inputMode, photos }));
    } catch {
      /* quota atteint ou navigation privée */
    }
  }, [booted, bubbles, state, quickReplies, inputMode, photos]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [open, bubbles, busy, quickReplies]);

  const applyTurn = useCallback((turn: Turn) => {
    setBubbles((current) => [
      ...current,
      ...turn.messages.map((message) => ({
        id: nextId(),
        role: "bot" as const,
        text: message.text,
        tone: message.tone,
      })),
    ]);
    setQuickReplies(turn.quickReplies ?? []);
    setState(turn.state);
    setInputMode(turn.input ?? { type: "text" });
    setAllowPhotos(Boolean(turn.allowPhotos));
    setAiEnhanced(Boolean(turn.enhancedBy));
    if (turn.state.step === "done") setPhotos([]);
  }, []);

  const send = useCallback(
    async (message: string, nextState?: AssistantState, echo = true) => {
      if (busy) return;
      if (echo && message && !message.startsWith("intent:")) {
        setBubbles((current) => [...current, { id: nextId(), role: "user", text: message }]);
      }
      setBusy(true);
      setQuickReplies([]);
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, state: nextState ?? state, photos, locale }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const turn = (await response.json()) as Turn;
        applyTurn(turn);
      } catch {
        setBubbles((current) => [
          ...current,
          { id: nextId(), role: "bot", text: dict.assistant.error, tone: "warning" },
        ]);
        setQuickReplies([{ label: dict.cta.callNow, value: "call", action: "call", href: telHref, emphasis: true }]);
      } finally {
        setBusy(false);
        setBooted(true);
      }
    },
    [applyTurn, busy, dict.assistant.error, dict.cta.callNow, locale, photos, state],
  );

  // Premier message d'accueil, envoyé une seule fois à la première ouverture.
  useEffect(() => {
    if (!open || booted || busy) return;
    void send("", { step: "greeting", data: {} }, false);
  }, [open, booted, busy, send]);

  /* ---------------------------------------------------------- actions */

  function handleQuickReply(reply: QuickReply) {
    switch (reply.action) {
      case "call":
        window.location.href = reply.href ?? telHref;
        return;
      case "whatsapp":
        window.open(reply.href ?? whatsappHref, "_blank", "noopener,noreferrer");
        return;
      case "photo":
        fileRef.current?.click();
        return;
      case "link":
        if (reply.href) router.push(reply.href);
        return;
      default:
        setBubbles((current) => [...current, { id: nextId(), role: "user", text: reply.label }]);
        void send(reply.value, undefined, false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || busy) return;
    setDraft("");
    void send(value);
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const uploaded: Attachment[] = [];
    for (const file of files.slice(0, 5 - photos.length)) {
      const body = new FormData();
      body.append("file", file);
      body.append("scope", "request");
      try {
        const response = await fetch("/api/media", { method: "POST", body });
        if (!response.ok) throw new Error("upload");
        const media = (await response.json()) as Attachment;
        uploaded.push(media);
      } catch {
        setBubbles((current) => [
          ...current,
          { id: nextId(), role: "bot", text: dict.request.errors.photoUpload, tone: "warning" },
        ]);
      }
    }
    if (uploaded.length > 0) {
      setPhotos((current) => [...current, ...uploaded]);
      void send("photos", undefined, false);
    }
  }

  function restart() {
    setBubbles([]);
    setPhotos([]);
    setQuickReplies([]);
    setState({ step: "greeting", data: {} });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sans conséquence */
    }
    void send("intent:restart", { step: "greeting", data: {} }, false);
  }

  /* ------------------------------------------------------------ rendu */

  return (
    <>
      {/* Bouton flottant */}
      <div className="no-print fixed bottom-24 end-4 z-40 hidden flex-col items-end gap-3 lg:bottom-6 lg:end-6 lg:flex">
        {teaser && !open ? (
          <div className="max-w-[16rem] animate-[rise_0.5s_ease-out] rounded-2xl rounded-be-sm border border-white/12 bg-ink-850 p-4 text-sm text-slate-200 shadow-2xl">
            <p className="font-semibold text-white">{dict.assistant.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{dict.hero.subtitle.slice(0, 90)}…</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full bg-aqua-400 px-3 py-1.5 text-xs font-bold text-ink-950"
              >
                {dict.cta.assistantShort}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeaser(false);
                  try {
                    sessionStorage.setItem(TEASER_KEY, "seen");
                  } catch {
                    /* sans conséquence */
                  }
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {dict.common.close}
              </button>
            </div>
          </div>
        ) : null}

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={dict.assistant.open}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aqua-300 to-aqua-600 text-ink-950 shadow-[0_18px_45px_-12px_rgba(6,170,212,0.9)] transition hover:scale-105"
          >
            <span
              className="absolute inset-0 rounded-full bg-aqua-400/50"
              style={{ animation: "pulse-ring 3.2s ease-out infinite" }}
            />
            <Icon name="send" size={24} className="relative" />
          </button>
        ) : null}
      </div>

      {/* Panneau */}
      {open ? (
        <div className="no-print fixed inset-0 z-[70] flex items-end justify-center sm:items-end sm:justify-end sm:p-6">
          <div
            className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dict.assistant.title}
            className="relative flex h-[86vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-ink-900 shadow-2xl sm:h-[38rem] sm:max-h-[80vh] sm:w-[26rem] sm:rounded-3xl"
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-ink-850 to-ink-800 px-4 py-3.5">
              <Logo className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{dict.assistant.title}</p>
                <p className="flex items-center gap-1.5 text-[0.7rem] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {aiEnhanced ? dict.assistant.poweredAi : dict.assistant.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={restart}
                aria-label={dict.assistant.restart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/8 hover:text-white"
              >
                <Icon name="refresh" size={17} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.assistant.close}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/8 hover:text-white"
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <div ref={listRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {bubbles.map((bubble) => (
                <div key={bubble.id} className={`flex ${bubble.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      bubble.role === "user"
                        ? "rounded-ee-sm bg-gradient-to-br from-aqua-400 to-aqua-600 font-medium text-ink-950"
                        : bubble.tone === "warning"
                          ? "rounded-es-sm border border-volt-400/40 bg-volt-400/12 text-volt-100"
                          : bubble.tone === "success"
                            ? "rounded-es-sm border border-emerald-400/35 bg-emerald-400/12 text-emerald-100"
                            : "rounded-es-sm bg-white/7 text-slate-100"
                    }`}
                  >
                    {bubble.text}
                  </div>
                </div>
              ))}

              {busy ? (
                <div className="flex justify-start">
                  <div className="typing flex items-center gap-1 rounded-2xl rounded-es-sm bg-white/7 px-4 py-3 text-slate-300">
                    <span />
                    <span />
                    <span />
                    <span className="sr-only">{dict.assistant.typing}</span>
                  </div>
                </div>
              ) : null}

              {photos.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {photos.map((photo) => (
                    <span
                      key={photo.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[0.7rem] text-slate-300"
                    >
                      <Icon name="camera" size={13} />
                      {photo.name.slice(0, 18)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {quickReplies.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-white/8 px-4 py-3">
                {quickReplies.map((reply) => (
                  <button
                    key={`${reply.value}-${reply.label}`}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    className={`rounded-full px-3.5 py-2 text-[0.78rem] font-semibold transition active:scale-95 ${
                      reply.emphasis
                        ? "bg-gradient-to-r from-volt-300 to-volt-500 text-ink-950"
                        : "border border-white/15 bg-white/6 text-slate-100 hover:bg-white/12"
                    }`}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-ink-850 px-3 py-3">
              <div className="flex items-end gap-2">
                {allowPhotos ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={dict.assistant.attach}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 text-slate-300 transition hover:bg-white/8 hover:text-white"
                  >
                    <Icon name="camera" size={18} />
                  </button>
                ) : null}
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  rows={1}
                  disabled={inputMode.type === "none" || busy}
                  inputMode={inputMode.type === "tel" ? "tel" : "text"}
                  placeholder={inputMode.type === "none" ? "" : inputMode.placeholder || dict.assistant.placeholder}
                  className="scroll-thin max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/12 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-aqua-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label={dict.assistant.send}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aqua-300 to-aqua-500 text-ink-950 transition disabled:opacity-40"
                >
                  <Icon name="send" size={18} />
                </button>
              </div>
              <p className="mt-2 px-1 text-[0.65rem] leading-snug text-slate-500">{dict.assistant.disclaimer}</p>
            </form>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleFiles}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
