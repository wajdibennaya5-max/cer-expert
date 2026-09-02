import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function HowItWorks({ dict }: { dict: Dictionary }) {
  const steps = [dict.how.steps.one, dict.how.steps.two, dict.how.steps.three, dict.how.steps.four];

  return (
    <Section tone="dark">
      <div className="tech-grid opacity-50" aria-hidden="true" />
      <div className="container-page relative">
        <SectionHeading tone="dark" eyebrow={dict.how.eyebrow} title={dict.how.title} subtitle={dict.how.subtitle} />

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 90} as="li" className="h-full">
              <div className="glass relative h-full rounded-3xl p-6 transition hover:border-white/25">
                <span className="font-display text-4xl font-extrabold text-transparent [-webkit-text-stroke:1.5px_rgba(34,204,238,0.55)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -end-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-aqua-400/60 to-transparent lg:block"
                  />
                ) : null}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
