// ============ Domaine partagé (miroir des DTO backend) ============

export type EpisodeStatus = "DRAFT" | "PUBLISHED";

/**
 * Taxonomie fermée héritée, utilisée uniquement par le Hall of Fame 3D (P3, cf.
 * AUDIT_CHECKLIST.md) pour choisir une silhouette de « relique ». La taxonomie publique
 * réelle est `Guest.category`, en texte libre.
 */
export type Sector = "automobile" | "tech" | "restauration" | "construction" | "agroalimentaire";

export interface GuestSummary {
  id: string;
  slug: string;
  name: string;
  role?: string;
  company?: string;
}

export interface Guest {
  id: string;
  slug: string;
  name: string;
  role?: string;
  company?: string;
  companyUrl?: string;
  city?: string;
  region?: string;
  /** Taxonomie libre (ex. « Création & design autochtone ») — pas de secteur fermé. */
  category?: string;
  /** Une phrase : ce que l'on apprend dans l'épisode de cet invité. */
  angle?: string;
  bio?: string;
  photoUrl?: string;
  /** Uniquement si réellement prononcée et validée par l'invité — jamais inventée. */
  quote?: string;
  featured?: boolean;
  /** Hérité — réservé au Hall of Fame 3D (P3). Utiliser `category` partout ailleurs. */
  sector?: Sector;
}

export interface TranscriptLine {
  t: number;             // timecode (secondes)
  text: string;
}

export interface Episode {
  id: string;
  slug: string;
  number: number;
  title: string;
  status: EpisodeStatus;
  shortDescription?: string;
  description?: string;
  publishedAt?: string;  // ISO — absent tant que status !== "PUBLISHED"
  durationSec: number;
  youtubeId?: string;
  audioUrl?: string;
  videoUrl?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  thumbnailUrl?: string;
  guests: GuestSummary[];
  transcript: TranscriptLine[];
}

// ---------- session ----------

export type Role = "MEMBER" | "ADMIN";

/** Session courante (GET /auth/me). Jamais de jeton : il vit dans un cookie HttpOnly. */
export interface Session {
  email: string;
  role: Role;
}

// ---------- boutique ----------

export interface Product {
  id: string;
  name: string;
  tagline: string;
  priceCents: number;
  currency: string;
  edition: string;       // ex. "Édition limitée — 50 pièces"
  /** Stock moins les réservations actives. */
  remaining: number;
  /** Achetable maintenant : drop ouvert, pièce active, stock restant. */
  available: boolean;
}

/** NONE = aucun drop programmé ; les autres états sont dérivés des dates persistées. */
export type DropStatus = "NONE" | "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface DropDto {
  status: DropStatus;
  slug: string | null;
  title: string | null;
  subtitle: string | null;
  heroImage: string | null;
  opensAt: string | null;   // ISO
  closesAt: string | null;  // ISO
  maxPerCustomer: number;
  products: Product[];
}

export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "PAYMENT_MISMATCH";

export interface OrderStatusDto {
  id: string;
  status: OrderStatus;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  reference: string;
}
