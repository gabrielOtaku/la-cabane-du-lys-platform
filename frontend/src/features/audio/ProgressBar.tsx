"use client";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { formatTime } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  onSeek: (seconds: number) => void;
  label?: string;
  fire?: boolean;
  disabled?: boolean;
}

const STEP = 5;
const PAGE = 30;

/** Barre de progression accessible : clic, glisser, clavier (flèches ±5 s, Page ±30 s, Début/Fin). */
export function ProgressBar({ value, max, onSeek, label = "Position de lecture", fire = false, disabled = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  const seekFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!ref.current || max <= 0) return;
    const r = ref.current.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * max);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    dragging.current = true;
    ref.current?.setPointerCapture(e.pointerId);
    seekFromPointer(e);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => { if (dragging.current) seekFromPointer(e); };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    ref.current?.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || max <= 0) return;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowLeft": case "ArrowDown": next = value - STEP; break;
      case "ArrowRight": case "ArrowUp": next = value + STEP; break;
      case "PageDown": next = value - PAGE; break;
      case "PageUp": next = value + PAGE; break;
      case "Home": next = 0; break;
      case "End": next = max; break;
      default: return;
    }
    e.preventDefault();
    onSeek(Math.max(0, Math.min(max, next)));
  };

  return (
    <div
      ref={ref}
      className="progress-hit"
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${formatTime(value)} sur ${formatTime(max)}`}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className={`progress${fire ? " progress-fire" : ""}`}>
        <i style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
