import { site } from "@/lib/site";
import type { GalleryItem, Review, Settings } from "./types";

export function defaultSettings(): Settings {
  return {
    areas: [...site.defaultAreas],
    announcement: {
      enabled: true,
      text: "Intervention rapide en plomberie et électricité — appelez-nous pour une urgence.",
    },
    showSampleReviews: true,
    rewards: {
      enabled: true,
      welcomeEnabled: true,
      welcomeTitle: "Bienvenue chez Wajdi & Tayssir Services Pro",
      welcomeText:
        "Créez votre première demande pour ouvrir votre espace client, suivre vos interventions et cumuler des points fidélité.",
      pointsPerRequest: 10,
      pointsPerCompleted: 25,
      pointsPerReview: 15,
      badges: [
        {
          key: "first_contact",
          emoji: "🏆",
          label: "Premier contact",
          description: "Votre première demande a bien été enregistrée.",
          trigger: "first_request",
          threshold: 1,
        },
        {
          key: "loyal",
          emoji: "⭐",
          label: "Client fidèle",
          description: "Trois demandes ou plus adressées à notre équipe.",
          trigger: "requests",
          threshold: 3,
        },
        {
          key: "home_expert",
          emoji: "🔧",
          label: "Expert maison",
          description: "Cinq demandes : vous entretenez votre logement sérieusement.",
          trigger: "requests",
          threshold: 5,
        },
        {
          key: "success",
          emoji: "⚡",
          label: "Intervention réussie",
          description: "Une intervention menée à son terme.",
          trigger: "completed",
          threshold: 1,
        },
      ],
      tiers: [
        { key: "bronze", label: "Bronze", minPoints: 0, perk: "Suivi de vos demandes dans l'espace client." },
        { key: "silver", label: "Argent", minPoints: 100, perk: "Rappel prioritaire lors de la prise en charge." },
        { key: "gold", label: "Or", minPoints: 250, perk: "Créneaux d'intervention proposés en priorité." },
      ],
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Galerie initiale : illustrations vectorielles intégrées au site.
 * Aucune image externe, aucune licence tierce — l'administrateur remplace
 * ces éléments par de vraies photos de chantier depuis /admin/galerie.
 */
export function defaultGallery(): GalleryItem[] {
  const base = new Date("2026-01-05T09:00:00.000Z").toISOString();
  const items: Array<Omit<GalleryItem, "id" | "createdAt" | "order">> = [
    {
      title: "Remplacement d'un mitigeur de cuisine",
      description: "Dépose de l'ancien robinet, pose d'un mitigeur neuf et contrôle d'étanchéité.",
      category: "plomberie",
      kind: "illustration",
      illustration: "faucet-scene",
      published: true,
    },
    {
      title: "Réparation d'une fuite sous évier",
      description: "Raccords remplacés, siphon nettoyé, test de mise en eau.",
      category: "avant-apres",
      kind: "illustration",
      illustration: "leak-scene",
      published: true,
    },
    {
      title: "Tableau électrique remis à neuf",
      description: "Circuits répartis, protections adaptées et repérage complet.",
      category: "electricite",
      kind: "illustration",
      illustration: "panel-scene",
      published: true,
    },
    {
      title: "Installation d'éclairage LED",
      description: "Spots encastrés et variateur compatible LED dans un séjour.",
      category: "installations",
      kind: "illustration",
      illustration: "lighting-scene",
      published: true,
    },
    {
      title: "Dépannage : plus de courant en soirée",
      description: "Recherche du défaut circuit par circuit, remise en service contrôlée.",
      category: "depannages",
      kind: "illustration",
      illustration: "fault-scene",
      published: true,
    },
    {
      title: "Chauffe-eau : détartrage et résistance",
      description: "Appareil déposé, cuve détartrée, résistance et joint remplacés.",
      category: "plomberie",
      kind: "illustration",
      illustration: "boiler-scene",
      published: true,
    },
    {
      title: "Débouchage d'une évacuation de douche",
      description: "Intervention mécanique, sans produit agressif pour les canalisations.",
      category: "depannages",
      kind: "illustration",
      illustration: "drain-scene",
      published: true,
    },
    {
      title: "Salle de bain : équipements posés",
      description: "Robinetterie, évacuation et fixations reprises entièrement.",
      category: "realisations",
      kind: "illustration",
      illustration: "bathroom-scene",
      published: true,
    },
  ];
  return items.map((item, index) => ({
    ...item,
    id: `demo-${index + 1}`,
    createdAt: base,
    order: index,
  }));
}

/**
 * Avis d'exemple, explicitement marqués `isSample`.
 * L'interface les affiche avec la mention « exemple » tant qu'ils ne sont pas
 * remplacés par de vrais témoignages : aucun faux avis n'est présenté comme réel.
 */
export function defaultReviews(): Review[] {
  const base = new Date("2026-01-10T10:00:00.000Z").toISOString();
  return [
    {
      id: "sample-1",
      createdAt: base,
      name: "Exemple de témoignage",
      area: "Tunis",
      rating: 5,
      comment:
        "Cet emplacement accueillera un avis client réel. Les témoignages sont publiés depuis la console d'administration après vérification.",
      serviceSlug: "reparation-fuite-eau",
      status: "published",
      isSample: true,
    },
    {
      id: "sample-2",
      createdAt: base,
      name: "Exemple de témoignage",
      area: "Ariana",
      rating: 5,
      comment: "Les clients peuvent déposer leur avis depuis la page Avis. Chaque avis est modéré avant publication.",
      serviceSlug: "depannage-electrique",
      status: "published",
      isSample: true,
    },
    {
      id: "sample-3",
      createdAt: base,
      name: "Exemple de témoignage",
      area: "Ben Arous",
      rating: 4,
      comment:
        "Remplacez ce texte par un vrai retour d'intervention depuis /admin/avis, ou supprimez les exemples en un clic.",
      serviceSlug: "tableau-electrique",
      status: "published",
      isSample: true,
    },
  ];
}
