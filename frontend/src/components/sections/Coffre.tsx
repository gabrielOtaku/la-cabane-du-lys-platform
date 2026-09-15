"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, ArrowRight, Search } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useEpisodes, useEpisodeSearch } from "@/lib/queries";
import { publishedEpisodes as mockEpisodes } from "@/data/episodes";
import { withDevFallback } from "@/lib/fixtures";
import { PLATFORM_LINKS } from "@/lib/platforms";
import {
  PlayerStatusNote, ProgressBar, WaveformVisualizer,
  useAudioLevels, useAudioPlayer, useTranscriptSync, type AudioTrack,
} from "@/features/audio";
import type { Episode } from "@/types";

const BARS = 64;
const PREVIEW_MAX = 180;

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5a3 3 0 0 0-2.1 2.1A31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zm-13.9 9.3V8.5l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.28c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.99-.18-1.11-.66-.12-.48.18-.99.66-1.11 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.15 1.23zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.78-.18-.6.18-1.2.78-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.84 4.28A9.93 9.93 0 0 0 12 1.5C6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5 22.5 17.8 22.5 12a9.94 9.94 0 0 0-3.66-7.72zM12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9zm0 4a5 5 0 0 0-5 5v.4a.5.5 0 0 0 1 0V12a4 4 0 0 1 8 0v.4a.5.5 0 0 0 1 0V12a5 5 0 0 0-5-5zm0 6.5a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 12 13.5zm0 4a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1z" />
    </svg>
  );
}

function PlatformLinks({ episode }: { episode?: Episode }) {
  const yt = episode?.youtubeId
    ? `https://www.youtube.com/watch?v=${episode.youtubeId}`
    : PLATFORM_LINKS.youtube;
  const spotify = episode?.spotifyUrl ?? PLATFORM_LINKS.spotify;
  const apple = episode?.appleUrl ?? PLATFORM_LINKS.apple;

  return (
    <div className="platform-links">
      <a href={yt} target="_blank" rel="noopener noreferrer" className="platform-btn yt">
        <YtIcon /> YouTube
      </a>
      <a href={spotify} target="_blank" rel="noopener noreferrer" className="platform-btn sp">
        <SpotifyIcon /> Spotify
      </a>
      {apple && (
        <a href={apple} target="_blank" rel="noopener noreferrer" className="platform-btn ap">
          <AppleIcon /> Apple Podcasts
        </a>
      )}
    </div>
  );
}

/** Lecteur de l'accueil : extrait de 3 minutes du dernier épisode, sur le moteur audio partagé. */
function FeaturedPlayer({ ep }: { ep: Episode }) {
  const player = useAudioPlayer();
  const track = useMemo<AudioTrack>(() => ({
    id: `${ep.id}:extrait`,
    title: ep.title,
    subtitle: `Extrait · ${ep.guests.map((g) => g.name).join(" & ")}`,
    src: ep.audioUrl,
    href: "/",
    durationSec: ep.durationSec,
    transcript: ep.transcript,
    limitSec: PREVIEW_MAX,
  }), [ep]);

  const current = player.isCurrent(track.id);
  const st = player.state;
  const pos = current ? st.currentTime : 0;
  const playing = current && st.status === "playing";
  const gate = current && st.status === "limit";
  const unavailable = !ep.audioUrl;
  const max = Math.min(PREVIEW_MAX, ep.durationSec > 0 ? ep.durationSec : PREVIEW_MAX);

  const levels = useAudioLevels(BARS, current);
  const { lines, activeIndex } = useTranscriptSync(ep.transcript, pos);
  const guestNames = ep.guests.map((g) => g.name).join(" & ");

  const onPlay = () => (current ? player.toggle() : player.play(track));
  const onSeek = (t: number) => (current ? player.seek(t) : player.play(track, { startAt: t }));
  const resetGate = () => player.seek(0);

  return (
    <div className="coffre-feat" data-reveal style={{ transitionDelay: ".1s", position: "relative" }}>
      {gate && (
        <div className="preview-gate" role="dialog" aria-modal="false" aria-labelledby="gate-title">
          <div className="gate-inner">
            <p id="gate-title">L&apos;extrait de 3 minutes est terminé.</p>
            <p className="gate-sub">Écoutez l&apos;épisode complet sur votre plateforme préférée.</p>
            <PlatformLinks episode={ep} />
            <button type="button" className="gate-close" onClick={resetGate}>Fermer l&apos;extrait</button>
          </div>
        </div>
      )}

      <div className="player">
        <div>
          <div className="player-tag">
            <span className="dot" /> Extrait · 3 min · Épisode {String(ep.number).padStart(2, "0")}
          </div>
          <h3>{ep.title}</h3>
          <div className="ep-meta">Avec {guestNames} · {formatTime(ep.durationSec)}</div>
        </div>

        <WaveformVisualizer levels={levels} progress={max > 0 ? pos / max : 0} playing={playing} />

        <div>
          <div className="controls">
            <button
              type="button"
              className="play-btn"
              data-cursor={playing ? "pause" : "play"}
              aria-label={playing ? "Mettre en pause" : "Lire l'extrait"}
              aria-pressed={playing}
              onClick={onPlay}
              disabled={unavailable}
            >
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <span className="time">{formatTime(pos)}</span>
            <ProgressBar value={pos} max={max} onSeek={onSeek} fire disabled={unavailable} label={`Position dans l'extrait de ${ep.title}`} />
            <span className="time">{formatTime(max)}</span>
          </div>
          {unavailable
            ? <p className="player-note" role="status">Extrait audio bientôt disponible.</p>
            : <PlayerStatusNote state={st} current={current} />}
          <PlatformLinks episode={ep} />
        </div>
      </div>

      <div className="transcript">
        <h4>Transcription en direct</h4>
        {lines.length === 0 ? (
          <p className="player-note">La transcription accompagnera l&apos;épisode à sa publication.</p>
        ) : (
          <div className="tlines">
            {lines.map((l, i) => (
              <p key={`${l.t}-${i}`} className={`tline${i === activeIndex ? " active" : ""}`} aria-current={i === activeIndex ? "true" : undefined}>
                {l.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Coffre() {
  const { data: apiEpisodes } = useEpisodes();
  const allEpisodes: Episode[] = withDevFallback(apiEpisodes, mockEpisodes, []);
  const ep = allEpisodes[0];

  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 350);
  const { data: searchResults } = useEpisodeSearch(debouncedQ);

  const displayGrid: Episode[] = debouncedQ.trim().length >= 2 && searchResults
    ? searchResults
    : allEpisodes.slice(1);

  if (!ep) {
    return (
      <section id="coffre" className="coffre">
        <div className="container">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Le Coffre — Épisodes</span>
            <h2 className="sec-title">Les premiers épisodes<br /><em>arrivent bientôt.</em></h2>
            <p className="lead">
              Trois épisodes ont déjà été tournés et sont en post-production. Suivez la chaîne YouTube
              pour être averti dès la première sortie.
            </p>
          </div>
          <PlatformLinks />
        </div>
      </section>
    );
  }

  return (
    <section id="coffre" className="coffre">
      <div className="container">
        <div className="sec-head" data-reveal>
          <span className="eyebrow">Le Coffre — Épisodes</span>
          <h2 className="sec-title">Chaque épisode, <em>une histoire</em><br />sans vernis.</h2>
          <p className="lead">Un extrait de 3 minutes pour ressentir l&apos;authenticité brute. L&apos;intégralité vous attend sur toutes les plateformes.</p>
        </div>

        <FeaturedPlayer ep={ep} />

        <div className="ep-search" data-reveal style={{ transitionDelay: ".15s" }}>
          <div className="search-wrap">
            <Search size={16} aria-hidden="true" />
            <label htmlFor="episode-search" className="sr-only">Rechercher dans les épisodes</label>
            <input
              id="episode-search"
              type="search"
              placeholder="Rechercher dans les épisodes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="ep-grid">
          {displayGrid.map((e, i) => (
            <Link
              key={e.id}
              href={`/episodes/${e.slug}`}
              className="ep-card"
              data-reveal
              data-tilt
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="ep-num">Épisode {String(e.number).padStart(2, "0")}</div>
              <h4>{e.title}</h4>
              <p>{e.shortDescription ?? e.description}</p>
              <div className="ep-foot">
                <span>{formatTime(e.durationSec)}</span>
                <span className="go">Écouter <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
          {debouncedQ.trim().length >= 2 && searchResults?.length === 0 && (
            <p style={{ opacity: .5, gridColumn: "1/-1" }} role="status">Aucun résultat pour « {debouncedQ} ».</p>
          )}
        </div>

        <div className="ep-see-all" data-reveal>
          <Link href="/episodes" className="btn btn-ghost">Voir tous les épisodes</Link>
        </div>
      </div>
    </section>
  );
}
