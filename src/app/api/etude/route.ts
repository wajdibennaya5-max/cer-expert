import { fail, invalid, logError, ok, readJson, serverError, tooMany } from "@/lib/api";
import { notifierDemande } from "@/lib/courriel";
import { defaultLocale } from "@/lib/i18n/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { phoneKey, store } from "@/lib/store";
import { demandeSolaireSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Point d'entrée du site solaire, hébergé ailleurs.
 *
 * Contrairement au formulaire de ce site, l'appel vient d'une autre origine :
 * il faut donc l'autoriser explicitement, et n'autoriser que celle-là. Un
 * point d'entrée public qui envoie des courriels sans contrôle d'origine
 * devient un relais à pourriel, et le domaine finit sur les listes noires —
 * emportant avec lui les courriels destinés aux vrais clients.
 */
const ORIGINES_AUTORISEES = (process.env.ORIGINES_SOLAIRE
  ?? "https://wajdibennaya5-max.github.io")
  .split(",")
  .map((origine) => origine.trim())
  .filter(Boolean);

/** En-têtes de partage entre origines, pour une origine reconnue seulement. */
function enTetesOrigine(request: Request): Record<string, string> {
  const origine = request.headers.get("origin");
  if (!origine || !ORIGINES_AUTORISEES.includes(origine)) return {};
  return {
    "Access-Control-Allow-Origin": origine,
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      ...enTetesOrigine(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/** Réponse JSON portant les en-têtes d'origine. */
function avecOrigine(reponse: Response, request: Request): Response {
  const entetes = new Headers(reponse.headers);
  for (const [cle, valeur] of Object.entries(enTetesOrigine(request))) {
    entetes.set(cle, valeur);
  }
  return new Response(reponse.body, { status: reponse.status, headers: entetes });
}

export async function POST(request: Request) {
  const origine = request.headers.get("origin");
  // Une origine inconnue est refusée avant tout traitement. Un appel sans
  // origine (curl, application mobile) reste permis : le navigateur est le
  // seul à en poser une, et c'est lui qu'on protège.
  if (origine && !ORIGINES_AUTORISEES.includes(origine)) {
    return fail("Origine non autorisée", 403);
  }

  const limite = rateLimit(`etude:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limite.allowed) return avecOrigine(tooMany(limite.retryAfterSeconds), request);

  const corps = await readJson(request);
  if (corps === null) return avecOrigine(fail("Requête illisible"), request);

  const lu = demandeSolaireSchema.safeParse(corps);
  if (!lu.success) return avecOrigine(invalid(lu.error), request);

  const entree = lu.data;
  // Champ piège : un robot le remplit, un humain ne le voit pas. On répond
  // comme si tout allait bien, pour ne rien lui apprendre.
  if (entree.company) return avecOrigine(ok({ reference: "WT-0000-0000" }), request);

  try {
    const e = entree.etude;
    const creee = await store.createRequest({
      locale: defaultLocale,
      source: "form",
      customer: {
        name: entree.name,
        phone: entree.phone,
        phoneKey: phoneKey(entree.phone),
        email: entree.email || undefined,
        area: entree.area || undefined,
      },
      service: {
        slug: "etude-solaire",
        category: "autre",
        label: "Étude photovoltaïque",
      },
      description: [
        `Estimation solaire : ${e.puissance} kWc, ${e.modules} modules, ${e.surface} m².`,
        `Consommation ${Math.round(e.consommation)} kWh/an au prix de ${e.prixKwh.toFixed(3)} DT/kWh.`,
        `Production ${Math.round(e.production)} kWh/an, économie ${Math.round(e.economieAnnuelle)} DT/an.`,
        entree.message || "",
      ].filter(Boolean).join(" "),
      urgency: "normal",
      photos: [],
      etude: {
        ...e,
        toiture: e.toiture
          ? { largeur: e.toiture.largeur, profondeur: e.toiture.profondeur }
          : undefined,
      },
    });

    // La demande est enregistrée : la notification ne doit plus rien pouvoir
    // compromettre, ni faire attendre le visiteur.
    void notifierDemande(creee).catch((erreur) => logError("etude.notify", erreur));

    return avecOrigine(ok({ reference: creee.reference }, { status: 201 }), request);
  } catch (erreur) {
    logError("etude.create", erreur);
    return avecOrigine(serverError(), request);
  }
}
