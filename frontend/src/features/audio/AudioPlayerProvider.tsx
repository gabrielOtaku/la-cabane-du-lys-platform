"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AudioEngine } from "./AudioEngine";
import { INITIAL_STATE, type AudioTrack, type PlayerState } from "./types";

export interface AudioPlayerApi {
  state: PlayerState;
  engine: AudioEngine | null;
  /** Charge la piste si nécessaire puis la lance (éventuellement à une position donnée). */
  play: (track: AudioTrack, opts?: { startAt?: number }) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  /** Décharge la piste : le mini lecteur disparaît. */
  stop: () => void;
  isCurrent: (trackId: string) => boolean;
}

const Ctx = createContext<AudioPlayerApi | null>(null);

const POS_PREFIX = "cdl:pos:";
const SAVE_EVERY_MS = 5_000;

function readSavedPosition(track: AudioTrack): number {
  if (track.limitSec) return 0; // un extrait recommence toujours au début
  try {
    const raw = localStorage.getItem(POS_PREFIX + track.id);
    const v = raw ? Number(raw) : 0;
    if (!Number.isFinite(v) || v < 10) return 0;
    if (track.durationSec && v > track.durationSec - 15) return 0;
    return v;
  } catch {
    return 0;
  }
}

function savePosition(track: AudioTrack, seconds: number) {
  if (track.limitSec) return;
  try {
    localStorage.setItem(POS_PREFIX + track.id, String(Math.floor(seconds)));
  } catch {
    /* stockage indisponible : la reprise est un confort, pas une nécessité */
  }
}

/** Fournisseur placé au niveau du layout : la lecture continue pendant la navigation. */
export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);
  const lastSave = useRef(0);

  useEffect(() => {
    const e = new AudioEngine();
    engineRef.current = e;
    setEngine(e);
    const unsub = e.subscribe(setState);
    return () => {
      unsub();
      e.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sauvegarde locale de la position (reprise après navigation ou fermeture).
  useEffect(() => {
    if (!state.track || state.status !== "playing") return;
    const now = Date.now();
    if (now - lastSave.current < SAVE_EVERY_MS) return;
    lastSave.current = now;
    savePosition(state.track, state.currentTime);
  }, [state.track, state.status, state.currentTime]);

  const play = useCallback((track: AudioTrack, opts?: { startAt?: number }) => {
    const e = engineRef.current;
    if (!e) return;
    const startAt = opts?.startAt ?? (e.getState().track?.id === track.id ? -1 : readSavedPosition(track));
    if (startAt >= 0) e.load(track, startAt);
    else e.load(track);
    void e.play();
  }, []);

  const api = useMemo<AudioPlayerApi>(() => ({
    state,
    engine,
    play,
    toggle: () => engineRef.current?.toggle(),
    pause: () => engineRef.current?.pause(),
    seek: (s) => engineRef.current?.seek(s),
    setVolume: (v) => engineRef.current?.setVolume(v),
    setRate: (r) => engineRef.current?.setRate(r),
    stop: () => engineRef.current?.unload(),
    isCurrent: (id) => state.track?.id === id,
  }), [state, engine, play]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAudioPlayer(): AudioPlayerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudioPlayer doit être utilisé sous AudioPlayerProvider.");
  return ctx;
}
