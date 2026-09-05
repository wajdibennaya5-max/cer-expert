import type { Locale } from "@/lib/i18n/config";
import type { ServiceCategory } from "@/content/services";

/** Statuts d'une demande — l'ordre du tableau fait foi pour l'affichage de la progression. */
export const requestStatuses = ["received", "analysis", "scheduled", "onsite", "done", "cancelled"] as const;
export type RequestStatus = (typeof requestStatuses)[number];

export const urgencyLevels = ["emergency", "urgent", "normal", "planned"] as const;
export type UrgencyLevel = (typeof urgencyLevels)[number];

export const galleryCategories = [
  "plomberie",
  "electricite",
  "avant-apres",
  "installations",
  "depannages",
  "realisations",
] as const;
export type GalleryCategory = (typeof galleryCategories)[number];

export interface TimelineEntry {
  at: string;
  status: RequestStatus;
  note?: string;
  by: "system" | "admin" | "client";
}

export interface AttachedMedia {
  id: string;
  name: string;
  mime: string;
  size: number;
}

/**
 * Une estimation solaire, telle que le site Solarys l'a calculée chez le
 * visiteur. Elle est jointe à la demande pour que l'équipe chiffre sans
 * rappeler — et conservée telle quelle : c'est ce que le client a vu.
 */
export interface EtudeSolaire {
  /** Consommation annuelle relevée sur la facture, en kWh. */
  consommation: number;
  /** Prix réellement payé du kilowattheure, déduit de la facture, en dinars. */
  prixKwh: number;
  puissance: number;
  modules: number;
  surface: number;
  production: number;
  economieAnnuelle: number;
  cout: number;
  /** Années avant remboursement, ou `null` si le projet ne se rembourse pas. */
  retour: number | null;
  /** Cotes du pan de toiture, quand le visiteur les a données. */
  toiture?: { largeur: number; profondeur: number };
}

export interface InterventionRequest {
  id: string;
  /** Référence communiquée au client, ex. WT-2609-4821. */
  reference: string;
  createdAt: string;
  updatedAt: string;
  locale: Locale;
  source: "form" | "assistant" | "admin";
  customer: {
    name: string;
    phone: string;
    /** Empreinte du téléphone : sert de clé client sans stocker de doublon en clair. */
    phoneKey: string;
    email?: string;
    address?: string;
    area?: string;
  };
  service: {
    slug: string;
    category: ServiceCategory | "autre";
    label: string;
  };
  description: string;
  urgency: UrgencyLevel;
  preferredDate?: string;
  preferredTime?: string;
  photos: AttachedMedia[];
  status: RequestStatus;
  appointment?: { date: string; time: string; technician?: string };
  timeline: TimelineEntry[];
  adminNotes: { at: string; text: string }[];
  /** Présente uniquement sur les demandes venues du site solaire. */
  etude?: EtudeSolaire;
}

export interface Review {
  id: string;
  createdAt: string;
  name: string;
  area?: string;
  rating: number;
  comment: string;
  serviceSlug?: string;
  status: "pending" | "published" | "rejected";
  /** Avis de démonstration : affiché comme exemple, jamais présenté comme un vrai témoignage. */
  isSample: boolean;
  reply?: string;
}

export interface GalleryItem {
  id: string;
  createdAt: string;
  title: string;
  description?: string;
  category: GalleryCategory;
  kind: "image" | "video" | "illustration";
  /** Média téléversé (id dans la table media). */
  mediaId?: string;
  /** Second média pour les avant/après. */
  beforeMediaId?: string;
  /** Illustration vectorielle intégrée au site (aucune dépendance externe). */
  illustration?: string;
  published: boolean;
  order: number;
}

export interface MediaRecord {
  id: string;
  createdAt: string;
  name: string;
  mime: string;
  size: number;
  /** Nom du fichier sur disque, relatif au dossier de stockage. */
  file: string;
  scope: "gallery" | "request";
}

export interface BadgeRule {
  key: string;
  emoji: string;
  label: string;
  description: string;
  /** Condition de déblocage. */
  trigger: "first_request" | "requests" | "completed" | "points";
  threshold: number;
}

export interface RewardTier {
  key: string;
  label: string;
  minPoints: number;
  perk: string;
}

export interface Settings {
  areas: string[];
  announcement: { enabled: boolean; text: string };
  showSampleReviews: boolean;
  rewards: {
    enabled: boolean;
    welcomeEnabled: boolean;
    welcomeTitle: string;
    welcomeText: string;
    pointsPerRequest: number;
    pointsPerCompleted: number;
    pointsPerReview: number;
    badges: BadgeRule[];
    tiers: RewardTier[];
  };
  updatedAt: string;
}

export interface ClientProfile {
  phoneKey: string;
  phone: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  points: number;
  badges: string[];
  requestCount: number;
  completedCount: number;
}

export interface RequestFilter {
  status?: RequestStatus | "all";
  category?: ServiceCategory | "all";
  urgency?: UrgencyLevel | "all";
  search?: string;
}
