import type { Episode } from "@/types";
import { guests } from "@/data/guests";

const g = (slug: string) => {
  const guest = guests.find((x) => x.slug === slug)!;
  return { id: guest.id, slug: guest.slug, name: guest.name, role: guest.role, company: guest.company };
};

/**
 * Repli local — utilisé uniquement si l'API backend (GET /episodes) ne répond pas.
 * Trois épisodes réels ont été tournés et sont en post-production : aucun n'est encore
 * publié, donc aucun n'a de date, de durée ou d'URL vidéo/audio réelle. Statut "DRAFT" =
 * ne jamais afficher comme disponible tant que le contenu n'est pas réellement en ligne.
 */
export const episodes: Episode[] = [
  {
    id: "ep-01-raphaelle-langevin",
    slug: "raphaelle-langevin-matsheshu-creations",
    number: 1,
    title: "Raphaëlle Langevin — Matsheshu Créations",
    status: "DRAFT",
    shortDescription: "Création, identité et entrepreneuriat culturel à Mashteuiatsh.",
    durationSec: 0,
    guests: [g("raphaelle-langevin")],
    transcript: [],
  },
  {
    id: "ep-02-steeven-hatotte",
    slug: "steeven-hatotte-shampoing-auto",
    number: 2,
    title: "Steeven Hatotte — SHampoing Auto",
    status: "DRAFT",
    shortDescription: "Démarrage local et acquisition de clientèle à Saint-Félicien.",
    durationSec: 0,
    guests: [g("steeven-hatotte")],
    transcript: [],
  },
  {
    id: "ep-03-web-icom",
    slug: "web-icom-solutions",
    number: 3,
    title: "Régis Lapierre Girard & Corentin — Web-Icom Solutions",
    status: "DRAFT",
    shortDescription: "Entrepreneuriat technologique et complémentarité entre associés.",
    durationSec: 0,
    guests: [g("regis-lapierre-girard"), g("corentin-web-icom")],
    transcript: [],
  },
];

export const getEpisode = (slug: string) => episodes.find((e) => e.slug === slug || e.id === slug);

/** Uniquement les épisodes publiés — actuellement aucun. */
export const publishedEpisodes = episodes.filter((e) => e.status === "PUBLISHED");
export const featuredEpisode = publishedEpisodes[0];
