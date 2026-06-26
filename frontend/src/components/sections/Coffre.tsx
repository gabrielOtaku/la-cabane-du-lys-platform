"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ArrowRight, Search } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useEpisodes, useEpisodeSearch } from "@/lib/queries";
import { episodes as mockEpisodes } from "@/data/episodes";
import type { Episode } from "@/types";

const BARS = 64;

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function Coffre() {
  const { data: apiEpisodes } = useEpisodes();
  const allEpisodes: Episode[] = apiEpisodes ?? mockEpisodes;
  const ep = allEpisodes[0];

  const [pos, setPos] = useState(768);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 350);
  const { data: searchResults } = useEpisodeSearch(debouncedQ);
  
  // Correction pour l'hydratation
  const [heights, setHeights] = useState<number[]>([]);

  const raf = useRef<number>();
  const last = useRef<number>(0);
  const barRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!playing || !ep) return;
    const tick = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000; last.current = ts;
      setPos((p) => (p + dt >= ep.durationSec ? 0 : p + dt));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); last.current = 0; };
  }, [playing, ep]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ep) return;
    const r = barRef.current!.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * ep.durationSec);
  };

  const displayGrid: Episode[] = debouncedQ.trim().length >= 2 && searchResults
    ? searchResults
    : allEpisodes.slice(1);

  if (!ep) return null;

  return (
    <section id="coffre" className="coffre">
      <div className="container">
        <div className="sec-head" data-reveal>
          <span className="eyebrow">Le Coffre — Épisodes</span>
          <h2 className="sec-title">Chaque épisode, <em>une histoire</em><br />sans vernis.</h2>
          <p className="lead">Un lecteur sur-mesure, une transcription qui défile au rythme de la conversation.</p>
        </div>

        <div className="coffre-feat" data-reveal style={{ transitionDelay: ".1s" }}>
          <div className="player">
            <div>
              <div className="player-tag"><span className="dot" /> À l&apos;écoute · Épisode {String(ep.number).padStart(2, "0")}</div>
              <h3>{ep.title}</h3>
              <div className="ep-meta">{formatTime(ep.durationSec)} · Entrepreneuriat &amp; réalité du terrain</div>
            </div>
            <div className="wave" id="wave">
              {heights.map((h, i) => (
                <i key={i} className={i <= activeBar ? "on" : ""} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div>
              <div className="controls">
                <button className="play-btn" data-cursor={playing ? "pause" : "play"} aria-label={playing ? "Pause" : "Lecture"} onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <span className="time">{formatTime(pos)}</span>
                <div className="progress" ref={barRef} onClick={seek}>
                  <i style={{ width: `${(pos / ep.durationSec) * 100}%` }} />
                </div>
                <span className="time">{formatTime(ep.durationSec)}</span>
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
            <Link key={e.id} href={`/episodes/${e.id}`} className="ep-card" data-reveal data-tilt style={{ transitionDelay: `${i * 0.08}s` }}>
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