"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { ProgressBar } from "./ProgressBar";

/**
 * Mini lecteur persistant : visible dès qu'une piste est chargée, sur toutes les pages sauf
 * celle qui porte déjà le lecteur complet de cette piste.
 */
export function MiniPlayer() {
  const pathname = usePathname();
  const { state, toggle, seek, stop, engine } = useAudioPlayer();
  const track = state.track;

  if (!track || state.status === "idle" || pathname === "/hall-of-fame") return null;
  if (track.href && pathname === track.href) return null;

  const max = engine?.maxTime() ?? state.duration;
  const playing = state.status === "playing";
  const busy = state.status === "loading";
  const unavailable = state.status === "unavailable";

  const note =
    state.status === "error" || state.status === "blocked" ? state.error :
    state.status === "limit" ? "Fin de l'extrait." :
    busy ? "Chargement…" :
    unavailable ? "Extrait bientôt disponible." : null;

  return (
    <div className="mini-player" role="region" aria-label="Lecteur audio">
      <button
        type="button"
        className="mp-btn"
        onClick={toggle}
        disabled={unavailable}
        aria-label={playing ? "Mettre en pause" : "Lecture"}
        aria-pressed={playing}
        data-cursor={playing ? "pause" : "play"}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className="mp-info">
        {track.href ? (
          <Link href={track.href} className="mp-title" title={track.title}>{track.title}</Link>
        ) : (
          <span className="mp-title">{track.title}</span>
        )}
        <div className="mp-row">
          <span className="time">{formatTime(state.currentTime)}</span>
          <ProgressBar value={state.currentTime} max={max} onSeek={seek} fire disabled={unavailable} label={`Position dans ${track.title}`} />
          <span className="time">{formatTime(max)}</span>
        </div>
        {note && <span className={`mp-sub${state.status === "error" ? " error" : ""}`} role="status">{note}</span>}
        {!note && track.subtitle && <span className="mp-sub">{track.subtitle}</span>}
      </div>

      <button type="button" className="mp-close" onClick={stop} aria-label="Arrêter la lecture et fermer le lecteur">
        <X size={18} />
      </button>
    </div>
  );
}
