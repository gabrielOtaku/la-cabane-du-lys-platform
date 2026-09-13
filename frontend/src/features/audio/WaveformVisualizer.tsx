"use client";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  levels: number[];
  /** Progression 0..1 : colore les barres déjà lues (braise). */
  progress: number;
  playing: boolean;
}

/**
 * Waveform décorative : la « braise » vit ici (barres lues, playhead, étincelles).
 * Le seek se fait sur la ProgressBar, accessible ; cette vue est masquée aux lecteurs d'écran.
 */
export function WaveformVisualizer({ levels, progress, playing }: Props) {
  const reduced = useReducedMotion();
  const bars = levels.length;
  const activeBar = Math.floor(progress * bars);

  const cls = (i: number) => {
    if (i > activeBar || activeBar === 0) return "";
    const ratio = i / activeBar;
    if (ratio < 0.35) return "on-cold";
    if (ratio < 0.7) return "on-warm";
    return "on-hot";
  };

  return (
    <div className="wave" aria-hidden="true" style={{ position: "relative" }}>
      {levels.map((h, i) => (
        <i key={i} className={cls(i)} style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
      {playing && !reduced && (
        <div className="sparks-wrap" style={{ left: `${(activeBar / bars) * 100}%` }}>
          <span className="spark" /><span className="spark" /><span className="spark" />
          <span className="spark" /><span className="spark" /><span className="spark" />
        </div>
      )}
    </div>
  );
}
