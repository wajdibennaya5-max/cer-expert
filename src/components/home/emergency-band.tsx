import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref, whatsappHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

/** Bandeau d'urgence : le seul endroit du site où le rouge/ambre domine. */
export function EmergencyBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-14">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(60% 120% at 15% 50%, rgba(245,158,11,0.22), transparent 60%), radial-gradient(50% 120% at 85% 50%, rgba(6,170,212,0.18), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative">
        <Reveal className="flex flex-col items-start gap-6 rounded-3xl border border-volt-400/25 bg-ink-900/70 p-7 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div className="flex items-start gap-4">
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-volt-400/15 text-volt-300">
              <Icon name="alert" size={26} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">{dict.emergency.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{dict.emergency.text}</p>
              <p className="mt-2 text-xs leading-relaxed text-volt-200/90">{dict.emergency.safety}</p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto">
            <a href={telHref} data-cta="call-emergency" className={button("volt", "lg", "w-full sm:w-auto")}>
              <Icon name="phone" size={18} />
              <PhoneText />
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={button("outline", "lg", "w-full sm:w-auto")}
            >
              <Icon name="whatsapp" size={18} />
              {dict.cta.whatsapp}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
