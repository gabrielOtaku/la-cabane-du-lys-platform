// ============ Domaine partagé (miroir des entités backend) ============

export type Sector =
  | "automobile"
  | "tech"
  | "restauration"
  | "construction"
  | "agroalimentaire";

export interface Guest {
  id: string;
  name: string;
  role: string;
  company: string;
  sector: Sector;
  revenue: string;       // ex. "12 M$ / an"
  employees: number;
  quote: string;
  lesson: string;
  episodeId: string;
}

export interface TranscriptLine {
  t: number;             // timecode (secondes)
  text: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  guestName: string;
  sector: Sector;
  durationSec: number;
  publishedAt: string;   // ISO
  description: string;
  audioUrl?: string;
  videoUrl?: string;
  transcript: TranscriptLine[];
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  priceCents: number;
  currency: string;
  edition: string;       // ex. "Édition limitée — 50 pièces"
  available: boolean;
}

export interface DropInfo {
  opensAt: string;       // ISO — prochaine ouverture de La Réserve
  products: Product[];
}
