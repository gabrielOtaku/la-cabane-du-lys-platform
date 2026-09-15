// ============ Back office (miroir des DTO backend, package dto.admin) ============
import type { GuestSummary, TranscriptLine } from "@/types";

export type EpisodeStatus = "DRAFT" | "PUBLISHED";
export type DropLifecycle = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DropStatusAdmin = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "ARCHIVED";
export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "PAYMENT_MISMATCH";

export interface AdminEpisode {
  id: string;
  slug: string;
  number: number;
  title: string;
  status: EpisodeStatus;
  shortDescription: string | null;
  description: string | null;
  publishedAt: string | null;   // ISO date
  durationSec: number;
  youtubeId: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  thumbnailUrl: string | null;
  guestIds: string[];
  guests: GuestSummary[];
  transcript: TranscriptLine[];
}

export interface EpisodeUpsert {
  title: string;
  number: number;
  slug?: string;
  shortDescription?: string;
  description?: string;
  durationSec: number;
  publishedAt?: string | null;
  youtubeId?: string;
  audioUrl?: string;
  videoUrl?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  thumbnailUrl?: string;
  guestIds: string[];
  transcript: TranscriptLine[];
}

export interface AdminGuest {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  company: string | null;
  companyUrl: string | null;
  city: string | null;
  region: string | null;
  category: string | null;
  angle: string | null;
  bio: string | null;
  photoUrl: string | null;
  quote: string | null;
  featured: boolean;
}

export interface GuestUpsert {
  name: string;
  slug?: string;
  role?: string;
  company?: string;
  companyUrl?: string;
  city?: string;
  region?: string;
  category?: string;
  angle?: string;
  bio?: string;
  photoUrl?: string;
  quote?: string;
  featured: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  tagline: string | null;
  priceCents: number;
  currency: string;
  edition: string | null;
  stock: number;
  reserved: number;
  remaining: number;
  available: boolean;
}

export interface ProductUpsert {
  name: string;
  tagline?: string;
  priceCents: number;
  currency: string;
  edition?: string;
  stock: number;
  available: boolean;
}

export interface AdminDrop {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  heroImage: string | null;
  opensAt: string | null;
  closesAt: string | null;
  lifecycle: DropLifecycle;
  status: DropStatusAdmin;
  maxPerCustomer: number;
  products: AdminProduct[];
  createdAt: string;
}

export interface DropUpsert {
  title: string;
  slug?: string;
  subtitle?: string;
  heroImage?: string;
  opensAt?: string | null;
  closesAt?: string | null;
  maxPerCustomer: number;
  productIds: string[];
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  customerEmail: string | null;
  dropSlug: string | null;
  stripeReference: string | null;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminOverview {
  episodesPublished: number;
  episodesDraft: number;
  guests: number;
  members: number;
  ordersPending: number;
  ordersPaid: number;
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}
