import type { Guest } from "@/types";

/**
 * Données de démonstration — invités du podcast (« Reliques » de la Salle des Trophées).
 * À remplacer par les vraies fiches via l'API backend (GET /guests).
 */
export const guests: Guest[] = [
  {
    id: "g-tremblay",
    name: "Marc Tremblay",
    role: "Fondateur & PDG",
    company: "Boréal Motors",
    sector: "automobile",
    revenue: "18 M$ / an",
    employees: 42,
    quote: "On m'avait promis que ça allait être simple. Ça ne l'a jamais été.",
    lesson: "Vendre, c'est écouter deux fois avant de parler une fois.",
    episodeId: "ep-012",
  },
  {
    id: "g-gagnon",
    name: "Sophie Gagnon",
    role: "Cofondatrice",
    company: "Lumen Data",
    sector: "tech",
    revenue: "9,5 M$ / an",
    employees: 28,
    quote: "La première année, j'ai travaillé 80 heures par semaine pour presque rien.",
    lesson: "Échouer assez tôt, c'est apprendre assez vite.",
    episodeId: "ep-011",
  },
  {
    id: "g-bouchard",
    name: "Léa Bouchard",
    role: "Cheffe & Propriétaire",
    company: "Maison Lavoie",
    sector: "restauration",
    revenue: "4,2 M$ / an",
    employees: 35,
    quote: "Les réseaux sociaux montrent l'assiette. Jamais les nuits blanches derrière.",
    lesson: "La constance bat le talent quand le talent n'est pas constant.",
    episodeId: "ep-010",
  },
  {
    id: "g-cote",
    name: "Daniel Côté",
    role: "Président",
    company: "Côté Construction",
    sector: "construction",
    revenue: "31 M$ / an",
    employees: 120,
    quote: "Le pire conseil reçu ? Lâche ta job tout de suite.",
    lesson: "Bâtis tes fondations avant tes étages — en affaires comme sur un chantier.",
    episodeId: "ep-009",
  },
  {
    id: "g-lavoie",
    name: "Émilie Lavoie",
    role: "Fondatrice",
    company: "Terroir du Lac",
    sector: "agroalimentaire",
    revenue: "6,8 M$ / an",
    employees: 54,
    quote: "Si je recommençais, je commencerais plus petit, mais plus honnête.",
    lesson: "Un bon produit se raconte tout seul. Le marketing ne fait qu'amplifier.",
    episodeId: "ep-008",
  },
];

export const getGuest = (id: string) => guests.find((g) => g.id === id);
