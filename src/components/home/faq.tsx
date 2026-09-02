import { Icon } from "@/components/icons";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * FAQ construite avec `<details>` natif : ouverture instantanée, accessible au
 * clavier et fonctionnelle même si JavaScript ne se charge pas.
 */
export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <Section tone="mist" id="faq">
      <div className="container-page">
        <SectionHeading eyebrow="FAQ" title={dict.faq.title} subtitle={dict.faq.subtitle} />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {dict.faq.items.map((item, index) => (
            <Reveal key={item.q} delay={index * 50}>
              <details className="group rounded-2xl border border-mist-200 bg-white px-5 shadow-card transition open:shadow-card-hover">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-base font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist-100 text-slate-600 transition group-open:rotate-180 group-open:bg-aqua-500 group-open:text-white">
                    <Icon name="chevronDown" size={16} />
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
