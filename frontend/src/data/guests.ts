import type { Guest } from "@/types";

/**
 * Repli local — utilisé uniquement si l'API backend (GET /guests) ne répond pas.
 * Invités réels validés (audit du 19 août 2026, Annexe A). Aucune donnée financière.
 * Bios sourcées des sites officiels des entreprises (matsheshucreations.com,
 * shampoingauto.com, web-icom.com). Aucune photo fournie par les invités pour l'instant —
 * `photoUrl` reste vide plutôt que d'utiliser un visuel générique.
 */
export const guests: Guest[] = [
  {
    id: "raphaelle-langevin",
    slug: "raphaelle-langevin",
    name: "Raphaëlle Langevin",
    role: "Fondatrice",
    company: "Matsheshu Créations",
    companyUrl: "https://matsheshucreations.com",
    city: "Mashteuiatsh",
    region: "Saguenay-Lac-Saint-Jean",
    category: "Création & design autochtone",
    angle: "Création, identité, entrepreneuriat culturel, développement d'une marque et d'une communauté.",
    bio: "Fondatrice de Matsheshu Créations, une boutique d'artisanat autochtone basée à Mashteuiatsh. L'entreprise propose des bijoux faits main, des vêtements à motifs autochtones et des jupes-rubans — une célébration du savoir-faire des Premières Nations, de Mashteuiatsh jusqu'à vous.",
    featured: true,
  },
  {
    id: "steeven-hatotte",
    slug: "steeven-hatotte",
    name: "Steeven Hatotte",
    role: "Fondateur",
    company: "SHampoing Auto",
    companyUrl: "https://shampoingauto.com",
    city: "Saint-Félicien",
    region: "Saguenay-Lac-Saint-Jean",
    category: "Service automobile",
    angle: "Démarrage local, acquisition de clientèle, qualité de service, ambition de croissance.",
    bio: "Fondateur de SHampoing Auto, une entreprise d'esthétique et de nettoyage automobile basée à Saint-Félicien.",
    featured: true,
  },
  {
    id: "regis-lapierre-girard",
    slug: "regis-lapierre-girard",
    name: "Régis Lapierre Girard",
    role: "Président — ventes et service",
    company: "Web-Icom Solutions",
    companyUrl: "https://web-icom.com",
    region: "Saguenay-Lac-Saint-Jean",
    category: "Solutions technologiques & commerciales",
    angle: "Entrepreneuriat technologique/commercial, solutions aux commerces, complémentarité entre associés.",
    bio: "Président de Web-Icom Solutions, responsable des ventes et du service. L'entreprise propose des systèmes de caisse et de paiement infonuagiques pour les commerces du Québec, dont le système Colossale Cloud.",
    quote: "Notre mission est d'offrir la possibilité à tout type de commerce de pouvoir se concentrer à 100 % sur son commerce.",
    featured: true,
  },
  {
    id: "corentin-web-icom",
    slug: "corentin-web-icom",
    name: "Corentin Guyon",
    role: "Technicien & installateur",
    company: "Web-Icom Solutions",
    companyUrl: "https://web-icom.com",
    region: "Saguenay-Lac-Saint-Jean",
    category: "Solutions technologiques & commerciales",
    angle: "Entrepreneuriat technologique/commercial, solutions aux commerces, complémentarité entre associés.",
    bio: "Technicien et installateur chez Web-Icom Solutions, responsable du support technique et de l'installation des systèmes de caisse.",
    quote: "Nous nous efforçons chaque jour de proposer le meilleur service à nos clients.",
    featured: true,
  },
];

export const getGuest = (slug: string) => guests.find((g) => g.slug === slug || g.id === slug);
