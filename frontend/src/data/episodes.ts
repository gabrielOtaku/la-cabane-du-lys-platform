import type { Episode } from "@/types";

/**
 * Données de démonstration — épisodes (« Le Coffre »).
 * À remplacer par l'API backend (GET /episodes, GET /episodes/{id}).
 */
export const episodes: Episode[] = [
  {
    id: "ep-012",
    number: 12,
    title: "Vendre une voiture, vendre un rêve",
    guestName: "Marc Tremblay",
    sector: "automobile",
    durationSec: 3852,
    publishedAt: "2026-05-28",
    description:
      "Marc Tremblay raconte comment il est passé d'un poste de vendeur à la tête de Boréal Motors — sans diplôme, mais avec une obsession du service.",
    audioUrl: "",
    transcript: [
      { t: 0, text: "« On m'avait promis que ça allait être simple. »" },
      { t: 642, text: "« La première année, j'ai travaillé 80 heures par semaine pour ne presque rien gagner. »" },
      { t: 1284, text: "« Le pire conseil que j'ai reçu ? Lâche ta job tout de suite. »" },
      { t: 1926, text: "« Ce qui m'a sauvé, c'est d'avoir échoué assez tôt pour apprendre vite. »" },
      { t: 2568, text: "« Les réseaux sociaux montrent la voiture. Jamais les dettes derrière. »" },
      { t: 3210, text: "« Si je recommençais, je commencerais plus petit, mais plus honnête. »" },
    ],
  },
  {
    id: "ep-011",
    number: 11,
    title: "La donnée comme matière première",
    guestName: "Sophie Gagnon",
    sector: "tech",
    durationSec: 3120,
    publishedAt: "2026-05-14",
    description:
      "De la recherche universitaire à une scale-up de 28 personnes : Sophie Gagnon démystifie le mythe de la « startup qui lève des millions du jour au lendemain ».",
    transcript: [
      { t: 0, text: "« Tout le monde voyait la levée de fonds. Personne ne voyait les refus. »" },
      { t: 520, text: "« On a pivoté trois fois avant de trouver ce que les clients voulaient vraiment. »" },
      { t: 1040, text: "« Le code, c'était 20 % du travail. Le reste, c'était la vente. »" },
      { t: 1560, text: "« J'ai appris à dire non. C'est la compétence la plus rentable. »" },
      { t: 2080, text: "« La donnée ne ment pas, mais elle ne décide pas à ta place. »" },
    ],
  },
  {
    id: "ep-010",
    number: 10,
    title: "Le feu en cuisine, le calme en affaires",
    guestName: "Léa Bouchard",
    sector: "restauration",
    durationSec: 2880,
    publishedAt: "2026-04-30",
    description:
      "Léa Bouchard sur la réalité d'un restaurant rentable : marges minces, équipe everything, et la discipline qui ne se voit jamais sur Instagram.",
    transcript: [
      { t: 0, text: "« Une assiette parfaite, c'est cent assiettes ratées avant. »" },
      { t: 480, text: "« La passion ne paie pas les fournisseurs. La gestion, oui. »" },
      { t: 960, text: "« Mon équipe, c'est mon vrai actif. Je la traite comme tel. »" },
      { t: 1440, text: "« On ferme un jour de plus par semaine, et on est plus rentables. »" },
    ],
  },
];

export const getEpisode = (id: string) => episodes.find((e) => e.id === id);
export const featuredEpisode = episodes[0];
