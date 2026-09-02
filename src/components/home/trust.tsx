import { Icon } from "@/components/icons";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Trust({ dict }: { dict: Dictionary }) {
  const items = [
    { key: "fast", icon: "spark", ...dict.trust.items.fast },
    { key: "qualified", icon: "user", ...dict.trust.items.qualified },
    { key: "clean", icon: "check", ...dict.trust.items.clean },
    { key: "trust", icon: "shield", ...dict.trust.items.trust },
    { key: "contact", icon: "phone", ...dict.trust.items.contact },
    { key: "home", icon: "home", ...dict.trust.items.home },
  ];

  return (
    <Section tone="mist" id="pourquoi-nous">
      <div className="container-page">
        <SectionHeading eyebrow={dict.footer.slogan} title={dict.trust.title} subtitle={dict.trust.subtitle} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.key} delay={index * 70} className="h-full">
              <div className="lift group h-full rounded-3xl border border-mist-200 bg-white p-6 shadow-card transition hover:shadow-card-hover">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 text-aqua-300 transition-transform duration-500 group-hover:scale-110">
                  <Icon name={item.icon} size={23} />
                </span>
                <h3 className="mt-5 text-base font-bold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
