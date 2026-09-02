#!/usr/bin/env node
/**
 * Jeu de données de démonstration.
 *
 * Crée quelques demandes d'intervention fictives pour explorer la console
 * d'administration (statistiques, filtres, calendrier) sans attendre de vrais
 * clients. À n'exécuter qu'en développement.
 *
 *   npm run seed            → ajoute les demandes de démonstration
 *   npm run seed -- --reset → efface d'abord toutes les données existantes
 *
 * Les demandes créées portent toutes la mention « [DÉMO] » dans leur
 * description : elles se repèrent et se suppriment en un coup d'œil.
 */
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const reset = process.argv.includes("--reset");

function phoneKey(phone) {
  const digits = phone.replace(/\D/g, "").slice(-9);
  return createHash("sha256").update(`wtsp:${digits}`).digest("hex").slice(0, 24);
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

function inDays(days) {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

const samples = [
  {
    name: "Sonia Gharbi",
    phone: "+216 20 111 222",
    area: "Tunis",
    slug: "reparation-fuite-eau",
    category: "plomberie",
    label: "Réparation de fuites d'eau",
    description: "[DÉMO] Fuite au niveau du raccord sous l'évier de la cuisine, le meuble est humide.",
    urgency: "urgent",
    status: "analysis",
    age: 1,
  },
  {
    name: "Karim Hammami",
    phone: "+216 22 333 444",
    area: "Ariana",
    slug: "depannage-electrique",
    category: "electricite",
    label: "Dépannage électrique",
    description: "[DÉMO] Le disjoncteur saute dès que la machine à laver démarre.",
    urgency: "emergency",
    status: "received",
    age: 0,
  },
  {
    name: "Leïla Ben Amor",
    phone: "+216 55 666 777",
    area: "Ben Arous",
    slug: "chauffe-eau",
    category: "plomberie",
    label: "Installation et réparation de chauffe-eau",
    description: "[DÉMO] Plus d'eau chaude depuis hier, le chauffe-eau a 8 ans.",
    urgency: "normal",
    status: "scheduled",
    age: 3,
    appointment: { date: inDays(2), time: "09:30", technician: "Wajdi" },
  },
  {
    name: "Nizar Ayari",
    phone: "+216 98 888 999",
    area: "La Manouba",
    slug: "tableau-electrique",
    category: "electricite",
    label: "Installation de tableaux électriques",
    description: "[DÉMO] Tableau vétuste à remplacer, devis souhaité avant travaux.",
    urgency: "planned",
    status: "done",
    age: 9,
  },
  {
    name: "Rym Cherif",
    phone: "+216 24 555 111",
    area: "Grand Tunis",
    slug: "debouchage-canalisation",
    category: "plomberie",
    label: "Débouchage de canalisations",
    description: "[DÉMO] Évacuation de la douche bouchée, l'eau stagne.",
    urgency: "urgent",
    status: "onsite",
    age: 0,
    appointment: { date: inDays(0), time: "16:00", technician: "Tayssir" },
  },
];

async function readJson(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, `${name}.json`), "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(name, value) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(value, null, 2), "utf8");
}

const existing = reset ? [] : await readJson("requests", []);
const clients = new Map((reset ? [] : await readJson("clients", [])).map((client) => [client.phoneKey, client]));

let counter = 0;
const created = samples.map((sample) => {
  counter += 1;
  const createdAt = daysAgo(sample.age);
  const key = phoneKey(sample.phone);
  const timeline = [{ at: createdAt, status: "received", by: "system", note: "Demande enregistrée." }];
  if (sample.status !== "received") {
    timeline.push({ at: createdAt, status: sample.status, by: "admin", note: "[DÉMO] Statut de démonstration." });
  }

  const client = clients.get(key) ?? {
    phoneKey: key,
    phone: sample.phone,
    name: sample.name,
    createdAt,
    updatedAt: createdAt,
    points: 0,
    badges: ["first_contact"],
    requestCount: 0,
    completedCount: 0,
  };
  client.requestCount += 1;
  if (sample.status === "done") client.completedCount += 1;
  client.points = client.requestCount * 10 + client.completedCount * 25;
  client.updatedAt = createdAt;
  clients.set(key, client);

  return {
    id: randomUUID(),
    reference: `WT-DEMO-${String(1000 + counter)}`,
    createdAt,
    updatedAt: createdAt,
    locale: "fr",
    source: counter % 2 === 0 ? "assistant" : "form",
    customer: { name: sample.name, phone: sample.phone, phoneKey: key, area: sample.area },
    service: { slug: sample.slug, category: sample.category, label: sample.label },
    description: sample.description,
    urgency: sample.urgency,
    photos: [],
    status: sample.status,
    appointment: sample.appointment,
    timeline,
    adminNotes: [],
  };
});

await writeJson("requests", [...created, ...existing]);
await writeJson("clients", [...clients.values()]);

console.log(`${created.length} demandes de démonstration écrites dans ${dataDir}`);
console.log("Elles portent la référence WT-DEMO-… et la mention [DÉMO] : supprimez-les depuis la console.");
