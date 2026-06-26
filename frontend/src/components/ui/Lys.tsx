import * as React from "react";

/**
 * Fleur de lys — l'emblème de La Cabane du Lys (et du Québec).
 * <LysDefs/> injecte une fois le dégradé bronze + le <symbol> réutilisable.
 * <Lys/> rend l'emblème via <use href="#lysmark"/>.
 */
export function LysDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="bz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d6a8" />
          <stop offset="0.4" stopColor="#d4af37" />
          <stop offset="0.75" stopColor="#8a6334" />
          <stop offset="1" stopColor="#e6c879" />
        </linearGradient>
        <symbol id="lysmark" viewBox="0 0 120 150">
          <g fill="url(#bz)">
            <path d="M60 5 C 66 24, 73 45, 67 63 C 65 69, 62 71, 60 73 Z" />
            <path d="M60 63 C 81 57, 94 67, 94 81 C 94 94, 88 103, 84 106 C 83 99, 79 90, 73 83 C 68 77, 63 73, 60 71 Z" />
            <path transform="matrix(-1,0,0,1,120,0)" d="M60 63 C 81 57, 94 67, 94 81 C 94 94, 88 103, 84 106 C 83 99, 79 90, 73 83 C 68 77, 63 73, 60 71 Z" />
            <path d="M45 65 Q 60 60 75 65 L 75 76 Q 60 81 45 76 Z" />
            <path d="M54 78 C 50 99, 57 114, 60 129 C 63 114, 70 99, 66 78 Z" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export function Lys({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 150" className={className} style={style} aria-hidden focusable="false">
      <use href="#lysmark" />
    </svg>
  );
}
