import { lireQr } from "@/lib/paiement/qr";

export const runtime = "nodejs";

/**
 * Sert le QR de paiement.
 *
 * La route ne prend AUCUN paramètre : elle sert le seul fichier que
 * l'environnement désigne. Il n'y a donc rien à falsifier dans la requête.
 *
 * Le cache est court — une heure — parce qu'un QR de paiement peut changer :
 * un an de cache immuable laisserait des clients payer sur un compte fermé.
 */
export async function GET() {
  const qr = await lireQr();
  if (!qr.ok) return new Response("Introuvable", { status: 404 });

  return new Response(new Uint8Array(qr.octets), {
    headers: {
      "Content-Type": qr.mime,
      "Content-Length": String(qr.octets.byteLength),
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'inline; filename="paiement-qr"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
