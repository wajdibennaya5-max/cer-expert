import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { mailHref, site, telHref } from "@/lib/site";
import { PhoneText } from "@/components/ui/phone-text";

/** Mise en page commune aux pages « Confidentialité » et « Conditions ». */
export function LegalContent({
  sections,
  updatedLabel,
}: {
  sections: { h: string; p: string }[];
  updatedLabel: string;
}) {
  const updated = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" });

  return (
    <Section tone="mist">
      <div className="container-page">
        <div className="mx-auto max-w-3xl rounded-3xl border border-mist-200 bg-white p-7 shadow-card sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {updatedLabel} : {updated}
          </p>
          <div className="mt-8 space-y-8">
            {sections.map((section, index) => (
              <Reveal key={section.h} delay={index * 40}>
                <h2 className="text-lg font-bold text-ink-900">{section.h}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{section.p}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 border-t border-mist-200 pt-6 text-sm text-slate-600">
            <p className="font-bold text-ink-900">{site.name}</p>
            <p className="mt-1">{site.tagline}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <a href={telHref} className="font-semibold text-aqua-700 hover:text-aqua-800">
                <PhoneText />
              </a>
              <a href={mailHref} className="font-semibold text-aqua-700 hover:text-aqua-800">
                {site.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
