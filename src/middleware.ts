import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n/config";

const LOCALE_COOKIE = "wtsp_locale";

/**
 * Routage linguistique.
 *
 * Toutes les pages publiques vivent sous /fr, /en ou /ar. Une URL sans préfixe
 * est redirigée vers la langue du visiteur (cookie, puis en-tête Accept-Language,
 * puis français). Conséquence utile : il n'existe jamais de page publique sans
 * langue, donc jamais de contenu dupliqué à deux adresses différentes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();

  const preferred = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && locales.includes(cookie as (typeof locales)[number])) return cookie;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, quality] = part.trim().split(";q=");
      return { tag: (tag ?? "").toLowerCase(), quality: Number(quality ?? 1) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base && locales.includes(base as (typeof locales)[number])) return base;
  }
  return defaultLocale;
}

export const config = {
  // Les routes techniques, les fichiers statiques et la console d'administration
  // ne sont pas concernés par le préfixe de langue.
  matcher: [
    "/((?!api|admin|image-partage|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
