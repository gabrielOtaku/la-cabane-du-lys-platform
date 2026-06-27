"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ArrowRight, Search } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useEpisodes, useEpisodeSearch } from "@/lib/queries";
import { episodes as mockEpisodes } from "@/data/episodes";
import { ScrollLink } from "@/components/ui/ScrollLink";
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

export function Coffre() {
  const { data: apiEpisodes } = useEpisodes();
  const allEpisodes: Episode[] = apiEpisodes ?? mockEpisodes;
  const ep = allEpisodes[0];

  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 350);
  const { data: searchResults } = useEpisodeSearch(debouncedQ);
  const [heights, setHeights] = useState<number[]>([]);

  const raf = useRef<number>();
  const last = useRef<number>(0);
  const barRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const sourceConnected = useRef(false);

  useEffect(() => {
    setHeights(Array.from({ length: BARS }, () => 18 + Math.random() * 82));
  }, []);

  const activeBar = ep ? Math.floor((pos / ep.durationSec) * BARS) : 0;

  const activeLine = useMemo(() => {
    if (!ep) return 0;
    let idx = 0;
    ep.transcript.forEach((l, i) => { if (pos >= l.t) idx = i; });
    return idx;
  }, [pos, ep]);

  const setupAudio = () => {
    if (sourceConnected.current || !audioRef.current || !ep?.audioUrl) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = BARS * 2;
    analyser.smoothingTimeConstant = 0.85;
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    freqRef.current = new Uint8Array(analyser.frequencyBinCount);
    sourceConnected.current = true;
  };

  const handlePlay = async () => {
    if (!ep) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      setupAudio();
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      if (audioRef.current && ep.audioUrl) {
        audioRef.current.currentTime = pos;
        audioRef.current.play().catch(() => {});
      }
      setPlaying(true);
    }
  };

  useEffect(() => {
    if (!playing || !ep) return;
    const tick = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000;
      last.current = ts;

      if (analyserRef.current && freqRef.current) {
        analyserRef.current.getByteFrequencyData(freqRef.current);
        const data = freqRef.current;
        setHeights(Array.from({ length: BARS }, (_, i) => 18 + (data[i] / 255) * 82));
      } else {
        setHeights(prev => prev.map(v => Math.max(18, Math.min(100, v + (Math.random() - 0.5) * 5))));
      }

      if (ep.audioUrl && audioRef.current) {
        const t = audioRef.current.currentTime;
        if (t >= PREVIEW_MAX) {
          audioRef.current.pause();
          setPlaying(false);
          setShowGate(true);
          return;
        }
        setPos(t);
      } else {
        setPos(p => {
          const next = p + dt;
          if (next >= PREVIEW_MAX) { setPlaying(false); setShowGate(true); return PREVIEW_MAX; }
          return next >= ep.durationSec ? 0 : next;
        });
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); last.current = 0; };
  }, [playing, ep]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ep || !barRef.current) return;
    const r = barRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * Math.min(ep.durationSec, PREVIEW_MAX);
    setPos(t);
    if (audioRef.current && ep.audioUrl) audioRef.current.currentTime = t;
  };

  const resetGate = () => {
    setShowGate(false);
    setPos(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const getBarClass = (i: number) => {
    if (i > activeBar) return "";
    const ratio = activeBar > 0 ? i / activeBar : 0;
    if (ratio < 0.35) return "on-cold";
    if (ratio < 0.70) return "on-warm";
    return "on-hot";
  };

  const displayGrid: Episode[] = debouncedQ.trim().length >= 2 && searchResults
    ? searchResults
    : allEpisodes.slice(1);

  if (!ep) return null;

  const playheadLeft = (activeBar / BARS) * 100;

  return (
    <section id="coffre" className="coffre">
      <div className="container">
        <div className="sec-head" data-reveal>
          <span className="eyebrow">Le Coffre — Épisodes</span>
          <h2 className="sec-title">Chaque épisode, <em>une histoire</em><br />sans vernis.</h2>
          <p className="lead">Un extrait de 3 minutes pour ressentir l&apos;authenticité brute. L&apos;intégralité vous attend sur toutes les plateformes.</p>
        </div>

        <div className="coffre-feat" data-reveal style={{ transitionDelay: ".1s", position: "relative" }}>

          {showGate && (
            <div className="preview-gate">
              <div className="gate-inner">
                <p>L&apos;extrait de 3 minutes est terminé.</p>
                <p className="gate-sub">Rejoins le Cercle pour accéder aux épisodes complets, aux notes détaillées et aux masterclasses exclusives.</p>
                <ScrollLink to="#cercle" className="btn btn-solid">Rejoindre le Cercle</ScrollLink>
                <button type="button" className="gate-close" onClick={resetGate}>Fermer l&apos;extrait</button>
              </div>
            </div>
          )}

          {ep.audioUrl && (
            <audio ref={audioRef} src={ep.audioUrl} crossOrigin="anonymous" preload="metadata" />
          )}

          <div className="player">
            <div>
              <div className="player-tag">
                <span className="dot" /> Extrait · 3 min · Épisode {String(ep.number).padStart(2, "0")}
              </div>
              <h3>{ep.title}</h3>
              <div className="ep-meta">{formatTime(ep.durationSec)} · Entrepreneuriat &amp; réalité du terrain</div>
            </div>

            <div className="wave" id="wave" style={{ position: "relative" }}>
              {heights.map((h, i) => (
                <i key={i} className={getBarClass(i)} style={{ height: `${h}%` }} />
              ))}
              {playing && (
                <div className="sparks-wrap" style={{ left: `${playheadLeft}%` }}>
                  <span className="spark" /><span className="spark" /><span className="spark" />
                  <span className="spark" /><span className="spark" /><span className="spark" />
                </div>
              )}
            </div>

            <div>
              <div className="controls">
                <button
                  type="button"
                  className="play-btn"
                  data-cursor={playing ? "pause" : "play"}
                  aria-label={playing ? "Pause" : "Lecture"}
                  onClick={handlePlay}
                >
                  {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <span className="time">{formatTime(pos)}</span>
                <div className="progress progress-fire" ref={barRef} onClick={seek}>
                  <i style={{ width: `${Math.min(100, (pos / PREVIEW_MAX) * 100)}%` }} />
                </div>
                <span className="time">{formatTime(PREVIEW_MAX)}</span>
              </div>

              <div className="platform-links">
                <a
                  href="https://youtube.com/@cabanedulys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn yt"
                >
                  <YtIcon /> YouTube
                </a>
                <a
                  href="https://open.spotify.com/show/cabanedulys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn sp"
                >
                  <SpotifyIcon /> Spotify
                </a>
                <a
                  href="https://podcasts.apple.com/ca/podcast/la-cabane-du-lys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn ap"
                >
                  <AppleIcon /> Apple Podcasts
                </a>
              </div>
            </div>
          </div>

          <div className="transcript">
            <h4>Transcription en direct</h4>
            <div className="tlines">
              {ep.transcript.map((l, i) => (
                <p key={i} className={`tline${i === activeLine ? " active" : ""}`}>{l.text}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="ep-search" data-reveal style={{ transitionDelay: ".15s" }}>
          <div className="search-wrap">
            <Search size={16} />
            <input
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
              href={`/episodes/${e.id}`}
              className="ep-card"
              data-reveal
              data-tilt
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="ep-num">Épisode {String(e.number).padStart(2, "0")}</div>
              <h4>{e.title}</h4>
              <p>{e.description}</p>
              <div className="ep-foot">
                <span>{formatTime(e.durationSec)}</span>
                <span className="go">Écouter <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
          {debouncedQ.trim().length >= 2 && searchResults?.length === 0 && (
            <p style={{ opacity: .5, gridColumn: "1/-1" }}>Aucun résultat pour « {debouncedQ} ».</p>
          )}
        </div>
      </div>
    </section>
  );
}
