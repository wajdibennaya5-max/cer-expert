/**
 * Notification par courriel des demandes reçues.
 *
 * L'application enregistrait les demandes sans prévenir personne : il fallait
 * ouvrir la console pour découvrir qu'un client attendait. Un client qui
 * attend une demi-journée appelle le concurrent d'à côté.
 *
 * TOUTE LA CONFIGURATION VIENT DE L'ENVIRONNEMENT, jamais du code — un mot de
 * passe écrit dans un fichier suivi par git est un mot de passe public.
 *
 *   SMTP_HOTE          ex. smtp.gmail.com, smtp-relay.brevo.com
 *   SMTP_PORT          465 (TLS direct) ou 587 (STARTTLS)
 *   SMTP_UTILISATEUR   l'identifiant de la boîte d'envoi
 *   SMTP_MOTDEPASSE    son mot de passe, ou un mot de passe d'application
 *   COURRIEL_EXPEDITEUR   ex. "Wajdi & Tayssir <contact@20122011.xyz>"
 *   COURRIEL_EQUIPE    où arrivent les notifications (plusieurs, séparées par des virgules)
 *
 * Sans SMTP_HOTE, rien n'est envoyé et rien n'échoue : la demande est
 * enregistrée comme avant, et un avertissement paraît dans la console. Le site
 * ne doit jamais refuser un client parce qu'une boîte n'est pas réglée.
 */
import { logError } from "@/lib/api";
import type { EtudeSolaire, InterventionRequest } from "@/lib/store";

/** L'envoi de courriel est-il configuré ? */
export function courrielConfigure(): boolean {
  return Boolean(process.env.SMTP_HOTE && process.env.SMTP_UTILISATEUR);
}

/** Les destinataires des notifications, dédoublonnés. */
export function destinataires(): string[] {
  return [...new Set((process.env.COURRIEL_EQUIPE ?? "")
    .split(",").map((a) => a.trim()).filter(Boolean))];
}

/** Neutralise une saisie de visiteur avant de l'écrire dans du HTML. */
export function echapper(brut: unknown): string {
  return String(brut ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

type Message = { sujet: string; html: string; texte: string };

const dt = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} DT`;
const kwh = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} kWh`;
const virgule = (v: number | string) => String(v).replace(".", ",");

/**
 * Les chiffres d'une estimation solaire, en lignes lisibles.
 * Ce sont exactement ceux que le visiteur avait sous les yeux : les
 * reformuler autrement ferait douter de l'un ou de l'autre.
 */
function lignesEtude(e: EtudeSolaire): Array<[string, string]> {
  const lignes: Array<[string, string]> = [
    ["Consommation", `${kwh(e.consommation)} par an`],
    ["Prix du kWh payé", `${virgule(e.prixKwh.toFixed(3))} DT`],
    ["Puissance conseillée", `${virgule(e.puissance)} kWc`],
    ["Modules", `${e.modules} modules, environ ${e.surface} m²`],
    ["Production estimée", `${kwh(e.production)} par an`],
    ["Économie estimée", `${dt(e.economieAnnuelle)} par an`],
    ["Coût estimé", dt(e.cout)],
    ["Retour sur investissement", e.retour ? `${virgule(e.retour.toFixed(1))} ans` : "au-delà de 25 ans"],
  ];
  if (e.toiture) {
    lignes.push(["Pan de toiture",
      `${virgule(e.toiture.largeur)} × ${virgule(e.toiture.profondeur)} m`]);
  }
  return lignes;
}

/**
 * Le courriel qui prévient l'équipe.
 *
 * Le sujet porte l'essentiel — nom, service, urgence — pour décider de
 * rappeler sans même ouvrir le message.
 */
export function messageEquipe(demande: InterventionRequest): Message {
  const c = demande.customer;
  const urgence = demande.urgency === "urgent" ? "URGENT — " : "";
  const lignes: Array<[string, string]> = [
    ["Référence", demande.reference],
    ["Client", c.name],
    ["Téléphone", c.phone],
    ["Courriel", c.email || "—"],
    ["Adresse", c.address || "—"],
    ["Zone", c.area || "—"],
    ["Service", demande.service.label],
    ["Urgence", demande.urgency],
    ["Souhaité", [demande.preferredDate, demande.preferredTime].filter(Boolean).join(" ") || "—"],
    ["Description", demande.description],
  ];
  if (demande.etude) lignes.push(...lignesEtude(demande.etude));

  return {
    sujet: `${urgence}${demande.service.label} — ${c.name} (${c.area || "zone non précisée"})`,
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      color:#111827;line-height:1.6;max-width:560px">
      <h2 style="margin:0 0 14px;font-size:18px">Nouvelle demande d'intervention</h2>
      <table style="border-collapse:collapse;font-size:15px">
        ${lignes.map(([t, v]) => `<tr>
          <td style="padding:6px 16px 6px 0;color:#6b7280;vertical-align:top">${t}</td>
          <td style="padding:6px 0;font-weight:600">${echapper(v)}</td></tr>`).join("")}
      </table>
      <p style="margin-top:18px">
        <a href="tel:${encodeURIComponent(c.phone)}" style="font-weight:700">Appeler</a>
        &nbsp;·&nbsp;
        <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, "")}" style="font-weight:700">WhatsApp</a>
      </p>
    </div>`,
    texte: ["Nouvelle demande d'intervention", "",
      ...lignes.map(([t, v]) => `${t} : ${v}`)].join("\n"),
  };
}

/**
 * L'étude renvoyée au client qui l'a demandée depuis le site solaire.
 * Il la retrouve par écrit, et peut l'opposer à un devis.
 */
function messageEtude(demande: InterventionRequest, e: EtudeSolaire): Message {
  const lignes = lignesEtude(e);
  return {
    sujet: `Votre étude solaire : ${dt(e.economieAnnuelle)} d'économie par an`,
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      color:#111827;line-height:1.6;max-width:560px">
      <p>Bonjour ${echapper(demande.customer.name)},</p>
      <p>Voici l'estimation calculée à partir des chiffres de votre facture STEG.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:18px;margin:18px 0">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.07em;
          color:#6b7280;font-weight:700">Votre économie estimée</div>
        <div style="font-size:32px;font-weight:800;color:#c84a21;margin-top:4px">
          ${dt(e.economieAnnuelle / 12)}
          <span style="font-size:15px;font-weight:600;color:#4b5563">par mois</span></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${lignes.map(([t, v]) => `<tr>
          <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6">${t}</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;
            border-bottom:1px solid #f3f4f6">${echapper(v)}</td></tr>`).join("")}
      </table>
      <p style="margin-top:20px;font-size:13.5px;color:#6b7280;border-top:1px solid #e5e7eb;
        padding-top:14px"><b>Cette estimation ne remplace pas une visite.</b> Elle ne voit
        ni l'orientation exacte de votre toit, ni l'ombre du bâtiment voisin, ni l'état de
        votre tableau électrique. Les coûts retenus sont des ordres de grandeur du marché
        tunisien, non un devis.</p>
      <p style="font-size:14px;color:#6b7280">Référence : ${echapper(demande.reference)}</p>
    </div>`,
    texte: [`Bonjour ${demande.customer.name},`, "",
      "Voici l'estimation calculée à partir des chiffres de votre facture STEG.", "",
      ...lignes.map(([t, v]) => `${t} : ${v}`), "",
      "Cette estimation ne remplace pas une visite.",
      `Référence : ${demande.reference}`].join("\n"),
  };
}

/** L'accusé de réception envoyé au client, quand il a laissé une adresse. */
export function messageClient(demande: InterventionRequest): Message {
  const lignes = [
    `Bonjour ${demande.customer.name},`, "",
    "Nous avons bien reçu votre demande et nous vous rappelons rapidement.", "",
    `Référence : ${demande.reference}`,
    `Service : ${demande.service.label}`,
    demande.customer.address ? `Adresse : ${demande.customer.address}` : "",
    "", "À très vite,", "Wajdi & Tayssir Services Pro",
  ].filter(Boolean);

  return {
    sujet: `Votre demande est bien reçue — ${demande.reference}`,
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      color:#111827;line-height:1.6;max-width:520px">
      <p>Bonjour ${echapper(demande.customer.name)},</p>
      <p>Nous avons bien reçu votre demande et nous vous rappelons rapidement.</p>
      <table style="border-collapse:collapse;font-size:15px;margin:16px 0">
        <tr><td style="padding:5px 16px 5px 0;color:#6b7280">Référence</td>
          <td style="padding:5px 0;font-weight:700">${echapper(demande.reference)}</td></tr>
        <tr><td style="padding:5px 16px 5px 0;color:#6b7280">Service</td>
          <td style="padding:5px 0;font-weight:700">${echapper(demande.service.label)}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:14px">Wajdi &amp; Tayssir Services Pro</p>
    </div>`,
    texte: lignes.join("\n"),
  };
}

/** Envoie un message par SMTP. Chargement paresseux : rien n'est requis si rien n'est configuré. */
async function expedier(destinataire: string, m: Message, repondreA?: string): Promise<void> {
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOTE,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,
    auth: {
      user: process.env.SMTP_UTILISATEUR,
      pass: process.env.SMTP_MOTDEPASSE,
    },
  });
  await transport.sendMail({
    from: process.env.COURRIEL_EXPEDITEUR || process.env.SMTP_UTILISATEUR,
    to: destinataire,
    subject: m.sujet,
    html: m.html,
    text: m.texte,
    replyTo: repondreA,
  });
}

/**
 * Prévient l'équipe, et accuse réception au client.
 *
 * N'échoue JAMAIS bruyamment : la demande est déjà enregistrée quand cette
 * fonction s'exécute, et une panne de messagerie ne doit pas la faire perdre
 * ni afficher une erreur au client qui vient de l'envoyer.
 */
export async function notifierDemande(demande: InterventionRequest): Promise<void> {
  if (!courrielConfigure()) {
    console.warn("⚠ SMTP non configuré : aucune notification envoyée pour "
      + `${demande.reference}. Renseignez SMTP_HOTE dans .env.local.`);
    return;
  }

  const equipe = destinataires();
  if (equipe.length === 0) {
    console.warn("⚠ COURRIEL_EQUIPE non renseigné : personne n'est prévenu.");
  }

  const envois: Array<Promise<unknown>> = equipe.map((adresse) =>
    expedier(adresse, messageEquipe(demande), demande.customer.email || undefined)
      .catch((error) => logError(`courriel.equipe:${adresse}`, error)));

  if (demande.customer.email) {
    const message = demande.etude
      ? messageEtude(demande, demande.etude)
      : messageClient(demande);
    envois.push(expedier(demande.customer.email, message)
      .catch((error) => logError("courriel.client", error)));
  }

  await Promise.allSettled(envois);
}
