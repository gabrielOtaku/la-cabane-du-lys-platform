"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { Episode } from "@/types";

const BARS = 72;

export function EpisodePlayer({ episode }: { episode: Episode }) {
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [heights, setHeights] = useState<number[]>([]);
  
  const raf = useRef<number>();
  const last = useRef<number>(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeights(Array.from({ length: BARS }, () => 16 + Math.random() * 84));
  }, []);

  const activeBar = Math.floor((pos / episode.durationSec) * BARS);
  const activeLine = useMemo(() => {
    let idx = -1;
    episode.transcript.forEach((l, i) => { if (pos >= l.t) idx = i; });
    return idx;
  }, [pos, episode.transcript]);

  useEffect(() => {
    if (!playing) return;
    const tick = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000; last.current = ts;
      setPos((p) => (p + dt >= episode.durationSec ? 0 : p + dt));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); last.current = 0; };
  }, [playing, episode.durationSec]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = barRef.current!.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * episode.durationSec);
  };
  const jumpTo = (t: number) => { setPos(t); setPlaying(true); };

  return (
    <div className="coffre-feat" style={{ marginTop: 10 }}>
      <div className="player">
        <div>
          <div className="player-tag"><span className="dot" /> Lecture · {episode.guestName}</div>
          <h3>{episode.title}</h3>
          <div className="ep-meta">{formatTime(episode.durationSec)}</div>
        </div>
        <div className="wave">
          {heights.map((h, i) => <i key={i} className={i <= activeBar ? "on" : ""} style={{ height: `${h}%` }} />)}
        </div>
        <div className="controls">
          <button className="play-btn" data-cursor={playing ? "pause" : "play"} aria-label={playing ? "Pause" : "Lecture"} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <span className="time">{formatTime(pos)}</span>
          <div className="progress" ref={barRef} onClick={seek}><i style={{ width: `${(pos / episode.durationSec) * 100}%` }} /></div>
          <span className="time">{formatTime(episode.durationSec)}</span>
        </div>
      </div>
      <div className="transcript">
        <h4>Transcription synchronisée</h4>
        <div className="tlines">
          {episode.transcript.map((l, i) => (
            <p key={i} className={`tline${i === activeLine ? " active" : ""}`} onClick={() => jumpTo(l.t)} style={{ cursor: "pointer" }}>
              {l.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}