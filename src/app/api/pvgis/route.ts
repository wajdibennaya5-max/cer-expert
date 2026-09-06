import { fail, logError, tooMany } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RELAIS VERS LE SERVICE DE DONNÉES SOLAIRES (PVGIS).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POURQUOI CE RELAIS EXISTE. Le service PVGIS ne renvoie pas d'en-tête  │
 * │ `Access-Control-Allow-Origin`. Un navigateur refuse donc la réponse,  │
 * │ quelle que soit la qualité du code appelant : le site solaire, qui    │
 * │ est statique, ne peut pas l'interroger lui-même. Ce point d'entrée    │
 * │ appelle le service depuis le serveur et renvoie la réponse telle      │
 * │ quelle, avec les en-têtes d'origine qui conviennent.                  │
 * │                                                                       │
 * │ IL NE TRANSFORME RIEN. La normalisation se fait côté site, dans       │
 * │ `js/pvgis/reponse.js`, avec ses tests. Un relais qui interprète       │
 * │ devient un second endroit où la logique peut diverger.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * TROIS PROTECTIONS, parce qu'un relais ouvert est un relais dont quelqu'un
 * se servira pour autre chose :
 *
 * 1. Seuls les chemins que nous savons exploiter sont permis. Une liste
 *    blanche, pas un filtre.
 * 2. Seuls les paramètres connus sont transmis, et chacun est validé. Rien
 *    de ce que l'appelant envoie n'atteint le service sans être relu.
 * 3. Limitation par adresse, et délai d'attente ferme.
 */

/** Adresse du service. Une seule, ici, et nulle part ailleurs. */
const BASE = "https://re.jrc.ec.europa.eu/api/v5_3";

/**
 * Les calculs autorisés, avec leur délai d'attente.
 *
 * Une liste blanche : un chemin absent d'ici ne sera jamais appelé, même si
 * quelqu'un le demande. Sans elle, ce point d'entrée deviendrait un proxy
 * ouvert vers tout ce domaine.
 */
const CALCULS: Record<string, { delaiMs: number }> = {
  PVcalc: { delaiMs: 15_000 },
  MRcalc: { delaiMs: 15_000 },
  DRcalc: { delaiMs: 15_000 },
  printhorizon: { delaiMs: 15_000 },
  SHScalc: { delaiMs: 20_000 },
  seriescalc: { delaiMs: 60_000 },
  tmy: { delaiMs: 60_000 },
};

/**
 * Les paramètres transmissibles, et comment les valider.
 *
 * Tout ce qui n'est pas dans cette table est écarté sans bruit. C'est ce qui
 * empêche un appelant d'ajouter des paramètres que nous n'avons pas prévus.
 */
type Regle = { type: "nombre"; min: number; max: number } | { type: "parmi"; valeurs: string[] };

const PARAMETRES: Record<string, Regle> = {
  lat: { type: "nombre", min: -90, max: 90 },
  lon: { type: "nombre", min: -180, max: 180 },
  peakpower: { type: "nombre", min: 0.001, max: 1_000_000 },
  loss: { type: "nombre", min: 0, max: 100 },
  angle: { type: "nombre", min: 0, max: 90 },
  aspect: { type: "nombre", min: -180, max: 180 },
  trackingtype: { type: "nombre", min: 0, max: 5 },
  usehorizon: { type: "nombre", min: 0, max: 1 },
  month: { type: "nombre", min: 0, max: 12 },
  global: { type: "nombre", min: 0, max: 1 },
  localtime: { type: "nombre", min: 0, max: 1 },
  showtemperatures: { type: "nombre", min: 0, max: 1 },
  batterysize: { type: "nombre", min: 1, max: 10_000_000 },
  consumptionday: { type: "nombre", min: 1, max: 10_000_000 },
  cutoff: { type: "nombre", min: 0, max: 100 },
  startyear: { type: "nombre", min: 1990, max: 2100 },
  endyear: { type: "nombre", min: 1990, max: 2100 },
  pvcalculation: { type: "nombre", min: 0, max: 1 },
  pvtechchoice: { type: "parmi", valeurs: ["crystSi", "CIS", "CdTe", "Unknown"] },
  mountingplace: { type: "parmi", valeurs: ["free", "building"] },
  raddatabase: {
    type: "parmi",
    valeurs: ["PVGIS-SARAH3", "PVGIS-SARAH2", "PVGIS-ERA5", "PVGIS-NSRDB"],
  },
  outputformat: { type: "parmi", valeurs: ["json"] },
};

/** Origines autorisées : les mêmes que le point d'entrée des demandes. */
const ORIGINES_AUTORISEES = (process.env.ORIGINES_SOLAIRE
  ?? "https://wajdibennaya5-max.github.io")
  .split(",")
  .map((origine) => origine.trim())
  .filter(Boolean);

function enTetesOrigine(request: Request): Record<string, string> {
  const origine = request.headers.get("origin");
  if (!origine || !ORIGINES_AUTORISEES.includes(origine)) return {};
  return { "Access-Control-Allow-Origin": origine, Vary: "Origin" };
}

function avecOrigine(reponse: Response, request: Request): Response {
  const entetes = new Headers(reponse.headers);
  for (const [cle, valeur] of Object.entries(enTetesOrigine(request))) {
    entetes.set(cle, valeur);
  }
  return new Response(reponse.body, { status: reponse.status, headers: entetes });
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      ...enTetesOrigine(request),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/** Ne garde que les paramètres connus, et seulement s'ils sont valides. */
function filtrer(entree: URLSearchParams): { params: URLSearchParams } | { erreur: string } {
  const sortie = new URLSearchParams();
  for (const [cle, valeur] of entree) {
    if (cle === "calcul") continue;
    const regle = PARAMETRES[cle];
    // Un paramètre inconnu est ignoré, pas refusé : le service peut en
    // gagner de nouveaux, et un site un peu en avance ne doit pas casser.
    if (!regle) continue;

    if (regle.type === "nombre") {
      const n = Number(valeur);
      if (!Number.isFinite(n) || n < regle.min || n > regle.max) {
        return { erreur: `Paramètre ${cle} hors des bornes admises.` };
      }
      sortie.set(cle, String(n));
    } else {
      if (!regle.valeurs.includes(valeur)) {
        return { erreur: `Paramètre ${cle} : valeur non reconnue.` };
      }
      sortie.set(cle, valeur);
    }
  }
  if (!sortie.has("lat") || !sortie.has("lon")) {
    return { erreur: "Latitude et longitude sont obligatoires." };
  }
  // On impose le format : nous ne savons lire que celui-là.
  sortie.set("outputformat", "json");
  return { params: sortie };
}

export async function GET(request: Request) {
  const origine = request.headers.get("origin");
  if (origine && !ORIGINES_AUTORISEES.includes(origine)) {
    return fail("Origine non autorisée", 403);
  }

  // Trente calculs par quart d'heure et par adresse : largement de quoi
  // explorer une étude, pas de quoi moissonner le service à travers nous.
  const limite = rateLimit(`pvgis:${clientIp(request)}`, 30, 15 * 60_000);
  if (!limite.allowed) return avecOrigine(tooMany(limite.retryAfterSeconds), request);

  const url = new URL(request.url);
  const calcul = url.searchParams.get("calcul") ?? "";
  const permis = CALCULS[calcul];
  if (!permis) {
    return avecOrigine(fail("Calcul non autorisé", 400), request);
  }

  const filtre = filtrer(url.searchParams);
  if ("erreur" in filtre) {
    return avecOrigine(fail(filtre.erreur, 400), request);
  }

  const cible = `${BASE}/${calcul}?${filtre.params.toString()}`;
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), permis.delaiMs);

  try {
    const reponse = await fetch(cible, {
      signal: controleur.signal,
      headers: { accept: "application/json" },
    });

    if (!reponse.ok) {
      // On ne renvoie pas le corps du service : il peut contenir des détails
      // internes, et le site sait déjà quoi dire de chaque code.
      logError("pvgis", new Error(`${calcul} → ${reponse.status}`));
      return avecOrigine(
        fail("Le service de données solaires n’a pas pu répondre", reponse.status),
        request,
      );
    }

    const corps = await reponse.text();
    return avecOrigine(
      new Response(corps, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          // Le rayonnement d'un lieu ne change pas d'un jour à l'autre :
          // un cache long soulage le service autant que notre serveur.
          "Cache-Control": "public, max-age=86400, s-maxage=2592000",
        },
      }),
      request,
    );
  } catch (erreur) {
    const avorte = erreur instanceof Error && erreur.name === "AbortError";
    logError("pvgis", erreur);
    return avecOrigine(
      fail(
        avorte
          ? "Le calcul a dépassé le délai d’attente"
          : "Le service de données solaires est injoignable",
        avorte ? 504 : 502,
      ),
      request,
    );
  } finally {
    clearTimeout(minuterie);
  }
}
