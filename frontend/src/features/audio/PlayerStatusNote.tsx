"use client";
import type { PlayerState } from "./types";

/** Message d'état du lecteur : média absent, chargement, lecture refusée, erreur. */
export function PlayerStatusNote({ state, current }: { state: PlayerState; current: boolean }) {
  if (!current) return null;
  switch (state.status) {
    case "unavailable":
      return <p className="player-note" role="status">Extrait audio bientôt disponible.</p>;
    case "loading":
      return <p className="player-note" role="status" aria-live="polite">Chargement de l&apos;audio…</p>;
    case "blocked":
      return <p className="player-note" role="status">{state.error}</p>;
    case "error":
      return <p className="player-note error" role="alert">{state.error}</p>;
    default:
      return null;
  }
}
