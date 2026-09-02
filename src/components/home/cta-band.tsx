import Link from "next/link";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { button } from "@/components/ui/button";
import { AssistantTrigger } from "@/components/assistant/assistant-button";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

/** Dernier appel à l'action de la page : trois chemins, un seul objectif. */
export function CtaBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink-900 via-ink-850 to-ink-950 p-8 text-center shadow-2xl sm:p-14">
            <div className="aurora opacity-70" aria-hidden="true" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                {dict.hero.titleLine1} {dict.hero.titleLine2}
                <br />
                <span className="text-gradient">{dict.hero.titleAccent}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {dict.request.subtitle}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={telHref} data-cta="call-band" className={button("volt", "xl", "w-full sm:w-auto")}>
                  <Icon name="phone" size={20} />
                  <PhoneText />
                </a>
                <Link href={localePath(locale, "demande")} className={button("primary", "xl", "w-full sm:w-auto")}>
                  <Icon name="spark" size={19} />
                  {dict.cta.request}
                </Link>
                <AssistantTrigger className={button("outline", "xl", "w-full sm:w-auto")}>
                  <Icon name="send" size={18} />
                  {dict.cta.assistantShort}
                </AssistantTrigger>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
