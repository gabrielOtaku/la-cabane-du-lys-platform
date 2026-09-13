import type { TranscriptLine } from "@/types";

/** Piste jouable par le moteur audio unique. */
export interface AudioTrack {
  /** Identifiant stable (id ou slug de l'épisode). */
  id: string;
  title: string;
  /** Ex. noms des invités. */
  subtitle?: string;
  /** Absent → média indisponible (épisode sans extrait). */
  src?: string;
  /** Page à ouvrir depuis le mini lecteur. */
  href?: string;
  /** Durée connue avant chargement des métadonnées. */
  durationSec?: number;
  transcript?: TranscriptLine[];
  /** Plafond de lecture en secondes (extrait de 3 minutes). */
  limitSec?: number;
}

export type PlayerStatus =
  | "idle"          // aucune piste
  | "unavailable"   // piste sans média
  | "loading"       // métadonnées ou tampon en cours
  | "ready"         // chargée, à l'arrêt
  | "playing"
  | "paused"
  | "ended"
  | "limit"         // plafond de l'extrait atteint
  | "blocked"       // lecture refusée par le navigateur (autoplay)
  | "error";        // erreur réseau ou format

export interface PlayerState {
  track: AudioTrack | null;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  rate: number;
  muted: boolean;
  error: string | null;
}

export const INITIAL_STATE: PlayerState = {
  track: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  volume: 1,
  rate: 1,
  muted: false,
  error: null,
};
