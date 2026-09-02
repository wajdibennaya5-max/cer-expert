import Link from "next/link";
import { Icon } from "@/components/icons";
import { HouseSystemsScene } from "@/components/illustrations";
import { AssistantTrigger } from "@/components/assistant/assistant-button";
import { button } from "@/components/ui/button";
import { services } from "@/content/services";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

export function Hero({ locale, dict, areaCount }: { locale: Locale; dict: Dictionary; areaCount: number }) {
  const stats = [
    { value: String(services.length), label: dict.hero.stats.services },
    { value: "2", label: dict.hero.stats.trades },
    { value: String(areaCount), label: dict.hero.stats.areas },
  ];

  return (
    <section className="section-dark relative isolate overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-44 lg:pb-28">
      <div className="aurora" aria-hidden="true" />
      <div className="tech-grid" aria-hidden="true" />

      <div className="container-page relative grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 xl:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-aqua-200 backdrop-blur-sm sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                style={{ animation: "pulse-ring 2.6s ease-out infinite" }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {dict.hero.badge}
          </p>

          <h1 className="mt-6 text-[2.1rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            {dict.hero.titleLine1}
            <br />
            {dict.hero.titleLine2}
            <br />
            <span className="text-gradient">{dict.hero.titleAccent}</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={telHref} data-cta="call-hero" className={button("volt", "xl", "w-full sm:w-auto")}>
              <Icon name="phone" size={20} />
              {dict.cta.callNow}
            </a>
            <Link href={localePath(locale, "demande")} className={button("primary", "xl", "w-full sm:w-auto")}>
              <Icon name="spark" size={20} />
              {dict.cta.request}
            </Link>
            <AssistantTrigger className={button("outline", "xl", "w-full sm:w-auto")}>
              <Icon name="send" size={19} />
              {dict.cta.assistant}
            </AssistantTrigger>
          </div>

          <a
            href={telHref}
            className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:border-volt-400/40 hover:bg-white/8"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-volt-400/15 text-volt-300">
              <Icon name="phone" size={20} />
            </span>
            <span className="text-start">
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {dict.hero.phoneLabel}
              </span>
              <span className="block font-display text-lg font-bold text-white">
                <PhoneText />
              </span>
            </span>
          </a>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-7">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-[0.7rem] leading-snug text-slate-400 sm:text-xs">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-6 xl:col-span-6">
          <div className="gradient-border relative rounded-[2rem] bg-ink-900/60 p-3 shadow-[0_40px_120px_-40px_rgba(6,170,212,0.6)] backdrop-blur-sm">
            <HouseSystemsScene className="w-full rounded-[1.6rem]" />
          </div>

          <div
            className="absolute -start-2 top-8 hidden items-center gap-2.5 rounded-2xl border border-white/12 bg-ink-850/90 px-4 py-3 shadow-xl backdrop-blur-md sm:flex"
            style={{ animation: "float 7s ease-in-out infinite" }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aqua-400/15 text-aqua-300">
              <Icon name="droplet" size={18} />
            </span>
            <span className="text-xs font-semibold text-white">{dict.services.plumbingTitle}</span>
          </div>

          <div
            className="absolute -end-2 bottom-10 hidden items-center gap-2.5 rounded-2xl border border-white/12 bg-ink-850/90 px-4 py-3 shadow-xl backdrop-blur-md sm:flex"
            style={{ animation: "float 8.5s ease-in-out infinite", animationDelay: "1.2s" }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt-400/15 text-volt-300">
              <Icon name="bolt" size={18} />
            </span>
            <span className="text-xs font-semibold text-white">{dict.services.electricalTitle}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
