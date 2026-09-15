"use client";
import { useMemo } from "react";
import { Play, Pause } from "lucide-react";
import { formatTime } from "@/lib/utils";
import {
  PlayerStatusNote, ProgressBar, WaveformVisualizer,
  useAudioLevels, useAudioPlayer, useTranscriptSync, type AudioTrack,
} from "@/features/audio";
import type { Episode } from "@/types";

const BARS = 72;

/** Lecteur complet de la page épisode : même moteur que l'accueil et le mini lecteur. */
export function EpisodePlayer({ episode }: { episode: Episode }) {
  const player = useAudioPlayer();

  const track = useMemo<AudioTrack>(() => ({
    id: episode.id,
    title: episode.title,
    subtitle: episode.guests.map((g) => g.name).join(", "),
    src: episode.audioUrl,
    href: `/episodes/${episode.slug}`,
    durationSec: episode.durationSec,
    transcript: episode.transcript,
  }), [episode]);

  const current = player.isCurrent(track.id);
  const st = player.state;
  const pos = current ? st.currentTime : 0;
  const duration = current && st.duration > 0 ? st.duration : episode.durationSec;
  const playing = current && st.status === "playing";
  const unavailable = !episode.audioUrl;

  const levels = useAudioLevels(BARS, current);
  const { lines, activeIndex } = useTranscriptSync(episode.transcript, pos);

  const onPlay = () => (current ? player.toggle() : player.play(track));
  const onSeek = (t: number) => (current ? player.seek(t) : player.play(track, { startAt: t }));
  const jumpTo = (t: number) => player.play(track, { startAt: t });

  return (
    <div className="coffre-feat" style={{ marginTop: 10 }}>
      <div className="player">
        <div>
          <div className="player-tag"><span className="dot" /> {playing ? "Lecture" : "Épisode"} · {track.subtitle}</div>
          <h3>{episode.title}</h3>
          <div className="ep-meta">{formatTime(duration)}</div>
        </div>

        <WaveformVisualizer levels={levels} progress={duration > 0 ? pos / duration : 0} playing={playing} />

        <div>
          <div className="controls">
            <button
              type="button"
              className="play-btn"
              data-cursor={playing ? "pause" : "play"}
              aria-label={playing ? "Mettre en pause" : "Lecture"}
              aria-pressed={playing}
              onClick={onPlay}
              disabled={unavailable}
            >
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <span className="time">{formatTime(pos)}</span>
            <ProgressBar value={pos} max={duration} onSeek={onSeek} disabled={unavailable} label={`Position dans ${episode.title}`} />
            <span className="time">{formatTime(duration)}</span>
          </div>
          {unavailable
            ? <p className="player-note" role="status">Extrait audio bientôt disponible.</p>
            : <PlayerStatusNote state={st} current={current} />}
        </div>
      </div>

      <div className="transcript">
        <h4 id="transcript-title">Transcription synchronisée</h4>
        {lines.length === 0 ? (
          <p className="player-note">La transcription sera ajoutée à la publication de l&apos;épisode.</p>
        ) : (
          <ol className="tlines" aria-labelledby="transcript-title">
            {lines.map((l, i) => (
              <li key={`${l.t}-${i}`}>
                <button
                  type="button"
                  className={`tline tline-btn${i === activeIndex ? " active" : ""}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  onClick={() => jumpTo(l.t)}
                  disabled={unavailable}
                >
                  <span className="tline-time">{formatTime(l.t)}</span> {l.text}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
