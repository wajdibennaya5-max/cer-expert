import Link from "next/link";
import { Icon } from "@/components/icons";
import { Illustration } from "@/components/illustrations";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { GalleryItem } from "@/lib/store/types";

export function GalleryPreview({ items, locale, dict }: { items: GalleryItem[]; locale: Locale; dict: Dictionary }) {
  if (items.length === 0) return null;

  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={dict.nav.gallery} title={dict.gallery.title} subtitle={dict.gallery.subtitle} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 60} className="h-full">
              <Link
                href={localePath(locale, "realisations")}
                className="lift group block h-full overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-card transition hover:shadow-card-hover"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-ink-900">
                  {item.kind === "illustration" || !item.mediaId ? (
                    <Illustration
                      name={item.illustration ?? "faucet-scene"}
                      title={item.title}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/media/${item.mediaId}`}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="block p-5">
                  <span className="inline-flex rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                    {dict.gallery.filters[item.category]}
                  </span>
                  <span className="mt-3 block text-base font-bold leading-snug text-ink-900">{item.title}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href={localePath(locale, "realisations")} className={button("light", "lg", "border border-mist-200")}>
            {dict.gallery.title}
            <Icon name="arrowRight" size={17} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
