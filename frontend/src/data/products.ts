import type { Product } from "@/types";

/**
 * Données de démonstration — pièces du prochain Drop (« La Réserve »).
 * À piloter via l'API backend (GET /shop/drop) + paiement Stripe.
 */
export const products: Product[] = [
  {
    id: "p-hoodie",
    name: "Hoodie « Bâtisseur »",
    tagline: "Coton lourd brodé fil or, étiquette numérotée à la main.",
    priceCents: 18500,
    currency: "CAD",
    edition: "Édition limitée — 50 pièces",
    available: false,
  },
  {
    id: "p-carnet",
    name: "Carnet de l'Entrepreneur",
    tagline: "Cuir pleine fleur, papier ivoire, gravure fleur de lys.",
    priceCents: 9000,
    currency: "CAD",
    edition: "Édition limitée — 100 pièces",
    available: false,
  },
  {
    id: "p-vip",
    name: "Pass VIP — Enregistrement live",
    tagline: "Accès à un enregistrement en studio + souper avec l'invité.",
    priceCents: 35000,
    currency: "CAD",
    edition: "10 places par saison",
    available: false,
  },
];
