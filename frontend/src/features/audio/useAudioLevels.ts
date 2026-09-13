"use client";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAudioPlayer } from "./AudioPlayerProvider";

/** Hauteurs de repos déterministes (pas de Math.random : rendu identique serveur / client). */
export function restingLevels(bars: number): number[] {
  return Array.from({ length: bars }, (_, i) => 0.22 + 0.5 * (0.5 + 0.5 * Math.sin(i * 1.9 + 0.6) * Math.cos(i * 0.37)));
}

/**
 * Niveaux 0..1 pour la waveform, pilotés par l'intensité sonore réelle quand la piste joue.
 * Avec « mouvement réduit », la waveform reste statique (la progression suffit).
 */
export function useAudioLevels(bars: number, active: boolean): number[] {
  const { engine, state } = useAudioPlayer();
  const reduced = useReducedMotion();
  const resting = useMemo(() => restingLevels(bars), [bars]);
  const [levels, setLevels] = useState<number[]>(resting);

  const playing = active && state.status === "playing";

  useEffect(() => {
    if (!playing || reduced || !engine) {
      setLevels(resting);
      return;
    }
    let raf = 0;
    const tick = () => {
      const l = engine.levels(bars);
      if (l) {
        setLevels(l.map((v) => 0.18 + v * 0.82));
      } else {
        // Analyse indisponible : respiration légère autour des niveaux de repos.
        setLevels((prev) => prev.map((v, i) => {
          const target = resting[i] ?? 0.4;
          const jitter = (Math.random() - 0.5) * 0.08;
          return Math.max(0.15, Math.min(1, v + (target - v) * 0.2 + jitter));
        }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, engine, bars, resting]);

  return levels;
}
