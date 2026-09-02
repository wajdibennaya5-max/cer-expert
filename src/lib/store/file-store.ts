import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultGallery, defaultReviews, defaultSettings } from "./defaults";
import type {
  ClientProfile,
  GalleryItem,
  InterventionRequest,
  MediaRecord,
  RequestFilter,
  RequestStatus,
  Review,
  Settings,
} from "./types";

/**
 * Stockage par fichiers JSON.
 *
 * Choisi comme implémentation par défaut parce qu'il ne demande aucun service
 * externe, aucune clé d'API et aucun abonnement : le site est pleinement
 * fonctionnel dès `npm run dev` comme sur un hébergement Node classique.
 * Les écritures sont sérialisées (file d'attente) et atomiques (écriture dans
 * un fichier temporaire puis `rename`), ce qui évite les fichiers corrompus.
 *
 * Pour un hébergement sans disque persistant (plateformes 100 % serverless),
 * voir README.md § « Base de données » : il suffit de fournir une autre
 * implémentation de l'interface `Store`.
 */

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type Collection = "requests" | "reviews" | "gallery" | "media" | "clients";

const cache = new Map<string, unknown>();
let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function fileFor(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  try {
    const raw = await fs.readFile(fileFor(name), "utf8");
    const parsed = JSON.parse(raw) as T;
    cache.set(name, parsed);
    return parsed;
  } catch {
    cache.set(name, fallback);
    return fallback;
  }
}

/** Écriture sérialisée et atomique : aucune écriture concurrente sur un même fichier. */
async function writeJson<T>(name: string, value: T): Promise<void> {
  cache.set(name, value);
  const task = writeQueue.then(async () => {
    await ensureDirs();
    const target = fileFor(name);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(tmp, target);
  });
  writeQueue = task.catch(() => undefined);
  await task;
}

async function readCollection<T>(name: Collection, seed: () => T[] = () => []): Promise<T[]> {
  const existing = await readJson<T[] | null>(name, null);
  if (existing) return existing;
  const seeded = seed();
  if (seeded.length > 0) await writeJson(name, seeded);
  else cache.set(name, seeded);
  return seeded;
}

/** Clé client dérivée du numéro de téléphone (non réversible, stable). */
export function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-9);
  return createHash("sha256").update(`wtsp:${digits}`).digest("hex").slice(0, 24);
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

async function nextReference(): Promise<string> {
  const requests = await readCollection<InterventionRequest>("requests");
  const now = new Date();
  const prefix = `WT-${pad(now.getDate())}${pad(now.getMonth() + 1)}`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const suffix = pad(Math.floor(1000 + Math.random() * 9000), 4);
    const candidate = `${prefix}-${suffix}`;
    if (!requests.some((request) => request.reference === candidate)) return candidate;
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

function matchesFilter(request: InterventionRequest, filter: RequestFilter): boolean {
  if (filter.status && filter.status !== "all" && request.status !== filter.status) return false;
  if (filter.category && filter.category !== "all" && request.service.category !== filter.category) return false;
  if (filter.urgency && filter.urgency !== "all" && request.urgency !== filter.urgency) return false;
  if (filter.search) {
    const needle = filter.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        request.reference,
        request.customer.name,
        request.customer.phone,
        request.customer.email ?? "",
        request.customer.address ?? "",
        request.customer.area ?? "",
        request.description,
        request.service.label,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

function byNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export const fileStore = {
  /* ------------------------------------------------------------------ demandes */
  async listRequests(filter: RequestFilter = {}): Promise<InterventionRequest[]> {
    const requests = await readCollection<InterventionRequest>("requests");
    return requests.filter((request) => matchesFilter(request, filter)).sort(byNewest);
  },

  async getRequest(id: string): Promise<InterventionRequest | undefined> {
    const requests = await readCollection<InterventionRequest>("requests");
    return requests.find((request) => request.id === id);
  },

  async getRequestByReference(reference: string): Promise<InterventionRequest | undefined> {
    const requests = await readCollection<InterventionRequest>("requests");
    const needle = reference.trim().toUpperCase();
    return requests.find((request) => request.reference.toUpperCase() === needle);
  },

  async listRequestsForClient(key: string): Promise<InterventionRequest[]> {
    const requests = await readCollection<InterventionRequest>("requests");
    return requests.filter((request) => request.customer.phoneKey === key).sort(byNewest);
  },

  async createRequest(
    input: Omit<
      InterventionRequest,
      "id" | "reference" | "createdAt" | "updatedAt" | "status" | "timeline" | "adminNotes"
    >,
  ): Promise<InterventionRequest> {
    const requests = await readCollection<InterventionRequest>("requests");
    const now = new Date().toISOString();
    const request: InterventionRequest = {
      ...input,
      id: randomUUID(),
      reference: await nextReference(),
      createdAt: now,
      updatedAt: now,
      status: "received",
      timeline: [{ at: now, status: "received", by: "system", note: "Demande enregistrée." }],
      adminNotes: [],
    };
    await writeJson("requests", [request, ...requests]);
    return request;
  },

  async updateRequest(id: string, patch: Partial<InterventionRequest>): Promise<InterventionRequest | undefined> {
    const requests = await readCollection<InterventionRequest>("requests");
    const index = requests.findIndex((request) => request.id === id);
    if (index === -1) return undefined;
    const current = requests[index];
    const updated: InterventionRequest = {
      ...current,
      ...patch,
      id: current.id,
      reference: current.reference,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const next = [...requests];
    next[index] = updated;
    await writeJson("requests", next);
    return updated;
  },

  async setRequestStatus(id: string, status: RequestStatus, note?: string): Promise<InterventionRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;
    const entry = { at: new Date().toISOString(), status, note, by: "admin" as const };
    return this.updateRequest(id, { status, timeline: [...request.timeline, entry] });
  },

  async addRequestNote(id: string, text: string): Promise<InterventionRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;
    return this.updateRequest(id, {
      adminNotes: [...request.adminNotes, { at: new Date().toISOString(), text }],
    });
  },

  async deleteRequest(id: string): Promise<boolean> {
    const requests = await readCollection<InterventionRequest>("requests");
    const next = requests.filter((request) => request.id !== id);
    if (next.length === requests.length) return false;
    await writeJson("requests", next);
    return true;
  },

  /* --------------------------------------------------------------------- avis */
  async listReviews(): Promise<Review[]> {
    const reviews = await readCollection<Review>("reviews", defaultReviews);
    return [...reviews].sort(byNewest);
  },

  async listPublishedReviews(): Promise<Review[]> {
    const [reviews, settings] = await Promise.all([this.listReviews(), this.getSettings()]);
    return reviews.filter(
      (review) => review.status === "published" && (settings.showSampleReviews || !review.isSample),
    );
  },

  async createReview(input: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const reviews = await readCollection<Review>("reviews", defaultReviews);
    const review: Review = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    await writeJson("reviews", [review, ...reviews]);
    return review;
  },

  async updateReview(id: string, patch: Partial<Review>): Promise<Review | undefined> {
    const reviews = await readCollection<Review>("reviews", defaultReviews);
    const index = reviews.findIndex((review) => review.id === id);
    if (index === -1) return undefined;
    const updated = { ...reviews[index], ...patch, id, createdAt: reviews[index].createdAt };
    const next = [...reviews];
    next[index] = updated;
    await writeJson("reviews", next);
    return updated;
  },

  async deleteReview(id: string): Promise<boolean> {
    const reviews = await readCollection<Review>("reviews", defaultReviews);
    const next = reviews.filter((review) => review.id !== id);
    if (next.length === reviews.length) return false;
    await writeJson("reviews", next);
    return true;
  },

  /* ------------------------------------------------------------------ galerie */
  async listGallery(): Promise<GalleryItem[]> {
    const items = await readCollection<GalleryItem>("gallery", defaultGallery);
    return [...items].sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt));
  },

  async listPublishedGallery(): Promise<GalleryItem[]> {
    return (await this.listGallery()).filter((item) => item.published);
  },

  async createGalleryItem(input: Omit<GalleryItem, "id" | "createdAt">): Promise<GalleryItem> {
    const items = await readCollection<GalleryItem>("gallery", defaultGallery);
    const item: GalleryItem = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    await writeJson("gallery", [...items, item]);
    return item;
  },

  async updateGalleryItem(id: string, patch: Partial<GalleryItem>): Promise<GalleryItem | undefined> {
    const items = await readCollection<GalleryItem>("gallery", defaultGallery);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    const updated = { ...items[index], ...patch, id, createdAt: items[index].createdAt };
    const next = [...items];
    next[index] = updated;
    await writeJson("gallery", next);
    return updated;
  },

  async deleteGalleryItem(id: string): Promise<boolean> {
    const items = await readCollection<GalleryItem>("gallery", defaultGallery);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    await writeJson("gallery", next);
    return true;
  },

  /* -------------------------------------------------------------------- média */
  async saveMedia(
    input: Omit<MediaRecord, "id" | "createdAt" | "file">,
    bytes: Buffer,
    extension: string,
  ): Promise<MediaRecord> {
    await ensureDirs();
    const id = randomUUID();
    const file = `${id}${extension}`;
    await fs.writeFile(path.join(UPLOAD_DIR, file), bytes);
    const media = await readCollection<MediaRecord>("media");
    const record: MediaRecord = { ...input, id, file, createdAt: new Date().toISOString() };
    await writeJson("media", [record, ...media]);
    return record;
  },

  async getMedia(id: string): Promise<MediaRecord | undefined> {
    const media = await readCollection<MediaRecord>("media");
    return media.find((record) => record.id === id);
  },

  async readMediaBytes(id: string): Promise<Buffer | undefined> {
    const record = await this.getMedia(id);
    if (!record) return undefined;
    // `record.file` est généré par le serveur (uuid + extension validée) : aucun
    // chemin fourni par l'utilisateur ne peut sortir du dossier de stockage.
    const target = path.join(UPLOAD_DIR, path.basename(record.file));
    try {
      return await fs.readFile(target);
    } catch {
      return undefined;
    }
  },

  async deleteMedia(id: string): Promise<boolean> {
    const media = await readCollection<MediaRecord>("media");
    const record = media.find((item) => item.id === id);
    if (!record) return false;
    await fs.rm(path.join(UPLOAD_DIR, path.basename(record.file)), { force: true });
    await writeJson(
      "media",
      media.filter((item) => item.id !== id),
    );
    return true;
  },

  /* ---------------------------------------------------------------- paramètres */
  async getSettings(): Promise<Settings> {
    const stored = await readJson<Settings | null>("settings", null);
    if (!stored) {
      const settings = defaultSettings();
      await writeJson("settings", settings);
      return settings;
    }
    // Fusion avec les valeurs par défaut : une nouvelle option ajoutée au code
    // n'invalide pas un fichier de configuration existant.
    const base = defaultSettings();
    return {
      ...base,
      ...stored,
      announcement: { ...base.announcement, ...stored.announcement },
      rewards: { ...base.rewards, ...stored.rewards },
    };
  },

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const next: Settings = {
      ...current,
      ...patch,
      announcement: { ...current.announcement, ...patch.announcement },
      rewards: { ...current.rewards, ...patch.rewards },
      updatedAt: new Date().toISOString(),
    };
    await writeJson("settings", next);
    return next;
  },

  /* ------------------------------------------------------------------ clients */
  async listClients(): Promise<ClientProfile[]> {
    const clients = await readCollection<ClientProfile>("clients");
    return [...clients].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getClient(key: string): Promise<ClientProfile | undefined> {
    const clients = await readCollection<ClientProfile>("clients");
    return clients.find((client) => client.phoneKey === key);
  },

  async upsertClient(profile: ClientProfile): Promise<ClientProfile> {
    const clients = await readCollection<ClientProfile>("clients");
    const index = clients.findIndex((client) => client.phoneKey === profile.phoneKey);
    const next = [...clients];
    if (index === -1) next.push(profile);
    else next[index] = profile;
    await writeJson("clients", next);
    return profile;
  },

  /** Vide le cache mémoire — utilisé par les scripts et les tests. */
  resetCache(): void {
    cache.clear();
  },
};

export type FileStore = typeof fileStore;
export const dataDirectory = DATA_DIR;
export const uploadDirectory = UPLOAD_DIR;
