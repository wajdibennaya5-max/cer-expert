import { z } from "zod";
import { services } from "@/content/services";
import { locales } from "@/lib/i18n/config";
import { galleryCategories, requestStatuses, urgencyLevels } from "@/lib/store/types";

/**
 * Schémas de validation partagés entre le navigateur et le serveur.
 * Le serveur revalide systématiquement : la validation côté client n'est
 * qu'un confort d'interface, jamais une garantie.
 */

const serviceSlugs = services.map((service) => service.slug);

/** 8 chiffres (Tunisie) à 15 chiffres (international), avec ou sans indicatif. */
export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Numéro de téléphone trop court")
  .max(24, "Numéro de téléphone trop long")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, "Numéro de téléphone invalide");

export const attachedMediaSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  mime: z.string().min(3).max(100),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(20 * 1024 * 1024),
});

export const interventionRequestSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom").max(80),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.email("Adresse e-mail invalide").max(120)]).optional(),
  serviceSlug: z
    .string()
    .trim()
    .max(80)
    .refine((value) => value === "autre" || serviceSlugs.includes(value), "Service inconnu"),
  description: z
    .string()
    .trim()
    .min(10, "Décrivez votre problème en quelques mots")
    .max(2000, "Description trop longue"),
  urgency: z.enum(urgencyLevels),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  area: z.string().trim().max(80).optional().or(z.literal("")),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Date invalide")
    .optional()
    .or(z.literal("")),
  preferredTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/u, "Heure invalide")
    .optional()
    .or(z.literal("")),
  photos: z.array(attachedMediaSchema).max(5, "5 photos au maximum").optional(),
  locale: z.enum(locales).optional(),
  source: z.enum(["form", "assistant", "admin"]).optional(),
  /**
   * Champ piège anti-robot. Il accepte n'importe quelle valeur : c'est la route
   * qui décide quoi en faire. Un robot qui le remplit reçoit une réponse
   * d'apparence normale plutôt qu'une erreur, ce qui évite de lui apprendre
   * comment contourner le piège.
   */
  company: z.string().max(200).optional(),
});

export type InterventionRequestInput = z.infer<typeof interventionRequestSchema>;

export const trackRequestSchema = z.object({
  reference: z.string().trim().min(4).max(24),
  phone: phoneSchema,
});

export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom").max(60),
  area: z.string().trim().max(60).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Votre avis est un peu court").max(1000),
  serviceSlug: z.string().trim().max(80).optional().or(z.literal("")),
  company: z.string().max(200).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
});

export const statusUpdateSchema = z.object({
  status: z.enum(requestStatuses),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const appointmentSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u),
  time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/u),
  technician: z.string().trim().max(80).optional().or(z.literal("")),
});

export const galleryItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  category: z.enum(galleryCategories),
  kind: z.enum(["image", "video", "illustration"]),
  mediaId: z.string().max(64).optional().or(z.literal("")),
  beforeMediaId: z.string().max(64).optional().or(z.literal("")),
  illustration: z.string().max(64).optional().or(z.literal("")),
  published: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

export const assistantMessageSchema = z.object({
  message: z.string().trim().max(1000),
  state: z
    .object({
      step: z.string().max(40),
      data: z.record(z.string(), z.string()).optional(),
      category: z.string().max(30).optional(),
    })
    .optional(),
  photos: z.array(attachedMediaSchema).max(5).optional(),
  locale: z.enum(locales).optional(),
});

/** Met en forme les erreurs Zod pour un affichage champ par champ. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
