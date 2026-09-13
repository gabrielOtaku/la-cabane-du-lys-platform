"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useMotionValue, useSpring } from "framer-motion";
import { fireflyBurst } from "@/features/effects/fireflies";

/**
 * Curseur fleur de lys V2 (feuille de route, phase 4).
 *
 *  - Symbole SVG partagé (#lysmark, voir LysDefs) : net à toute échelle, recolorable.
 *  - Halo avec inertie légère ; transformations limitées sur les éléments magnétiques.
 *  - Modes : default · link · button · text (curseur natif dans les champs) · play · pause · 3d.
 *  - Lucioles au clic ; variante Play : elles convergent vers la waveform du lecteur.
 *  - Désactivé sur écran tactile et avec « mouvement réduit » : le curseur natif reste disponible.
 *  - Le calque n'intercepte jamais les clics (pointer-events: none).
 */

type CursorMode = "default" | "link" | "button" | "text" | "magnetic" | "3d" | "play" | "pause";

const SPRING = { stiffness: 110, damping: 20, mass: 0.45 };
const LYS_SIZE = 16; // px sur bureau (14 à 18 recommandés)

const RING: Record<CursorMode, { scale: number; opacity: number; borderColor: string }> = {
  default:  { scale: 1,    opacity: 0.85, borderColor: "rgba(255,170,0,0.55)" },
  link:     { scale: 1.6,  opacity: 1,    borderColor: "rgba(255,170,0,0.85)" },
  button:   { scale: 1.9,  opacity: 1,    borderColor: "rgba(255,170,0,0.95)" },
  magnetic: { scale: 1.9,  opacity: 1,    borderColor: "rgba(255,170,0,0.95)" },
  text:     { scale: 0.6,  opacity: 0,    borderColor: "rgba(255,170,0,0)" },
  "3d":     { scale: 1.8,  opacity: 1,    borderColor: "rgba(255,170,0,0.4)" },
  play:     { scale: 2.0,  opacity: 1,    borderColor: "rgba(255,170,0,0.8)" },
  pause:    { scale: 2.0,  opacity: 1,    borderColor: "rgba(255,170,0,0.8)" },
};

const LYS: Record<CursorMode, { scale: number; opacity: number; rotate: number }> = {
  default:  { scale: 1,    opacity: 1,   rotate: 0 },
  link:     { scale: 1.15, opacity: 1,   rotate: -8 },
  button:   { scale: 1.15, opacity: 1,   rotate: -8 },
  magnetic: { scale: 1.15, opacity: 1,   rotate: -8 },
  text:     { scale: 0.7,  opacity: 0,   rotate: 0 },
  "3d":     { scale: 0.9,  opacity: 0.9, rotate: 0 },
  play:     { scale: 0.85, opacity: 0.9, rotate: 0 },
  pause:    { scale: 0.85, opacity: 0.9, rotate: 0 },
};

const TEXT_FIELDS = "input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=''], [contenteditable='true']";

function detectMode(target: Element | null): CursorMode {
  if (!target) return "default";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged?.dataset.cursor) {
    const m = tagged.dataset.cursor;
    if (m === "play" || m === "pause" || m === "3d" || m === "magnetic" || m === "text") return m;
  }
  if (target.closest(TEXT_FIELDS)) return "text";
  if (target.closest("button, [role='button'], [role='slider'], label, summary")) return "button";
  if (target.closest("a[href]")) return "link";
  return "default";
}

function useCursorEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return enabled;
}

export function CustomCursor() {
  const enabled = useCursorEnabled();

  // La classe pilote « cursor: none » en CSS : sans elle, le curseur natif reste intact.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("custom-cursor", enabled);
    if (!enabled) delete root.dataset.cursorMode;
    return () => { root.classList.remove("custom-cursor"); delete root.dataset.cursorMode; };
  }, [enabled]);

  if (!enabled) return null;
  return <CursorLayer />;
}

function CursorLayer() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const ringX = useSpring(rawX, SPRING);
  const ringY = useSpring(rawY, SPRING);

  const modeRef = useRef<CursorMode>("default");
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);
  const ringCtrl = useAnimationControls();
  const lysCtrl = useAnimationControls();

  const switchMode = useCallback((m: CursorMode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setMode(m);
    document.documentElement.dataset.cursorMode = m;
    const ease = [0.16, 1, 0.3, 1] as const;
    ringCtrl.start({ ...RING[m], transition: { duration: 0.26, ease } });
    lysCtrl.start({ ...LYS[m], transition: { duration: 0.2, ease } });
  }, [ringCtrl, lysCtrl]);

  useEffect(() => {
    let shown = false;
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!shown) { shown = true; setVisible(true); }
    };
    const onOver = (e: MouseEvent) => switchMode(detectMode(e.target as Element | null));
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const m = modeRef.current;
      if (m === "text") return;

      // Contraction du halo (retour visuel court, famille « Luciole »).
      const base = RING[m].scale;
      ringCtrl.start({
        scale: [base, base * 0.55, base],
        transition: { duration: 0.32, times: [0, 0.3, 1], ease: "easeOut" },
      });

      // Variante Play : convergence vers la waveform du lecteur cliqué.
      let towards: { x: number; y: number } | undefined;
      if (m === "play") {
        const player = (e.target as Element | null)?.closest(".player, .mini-player");
        const wave = player?.querySelector<HTMLElement>(".wave, .progress");
        if (wave) {
          const r = wave.getBoundingClientRect();
          towards = { x: r.left + r.width * 0.35, y: r.top + r.height / 2 };
        }
      }
      fireflyBurst(e.clientX, e.clientY, { towards });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [rawX, rawY, switchMode, ringCtrl]);

  return (
    <>
      {/* Halo — inertie via ressort */}
      <motion.div
        className="cursor-ring"
        animate={ringCtrl}
        initial={RING.default}
        style={{ x: ringX, y: ringY, opacity: visible ? undefined : 0 }}
        aria-hidden="true"
      >
        {mode === "3d" && (
          <motion.div
            style={{ position: "absolute", inset: -30, pointerEvents: "none" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 90 90" width="90" height="90" aria-hidden>
              <defs>
                <path id="orb-path" d="M 45,45 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
              </defs>
              <text fill="rgba(255,185,60,0.88)" fontSize="7" fontFamily="var(--serif)" letterSpacing="1.8">
                <textPath href="#orb-path">VOIR LA RELIQUE • VOIR LA RELIQUE •</textPath>
              </text>
            </svg>
          </motion.div>
        )}
        {(mode === "play" || mode === "pause") && (
          <motion.span
            key={mode}
            className="cursor-ring-icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
          >
            {mode === "play" ? "▶" : "⏸"}
          </motion.span>
        )}
      </motion.div>

      {/* Fleur de lys — position instantanée, pointe du curseur */}
      <motion.svg
        className="cursor-lys"
        viewBox="0 0 120 150"
        width={LYS_SIZE}
        height={LYS_SIZE * 1.25}
        animate={lysCtrl}
        initial={LYS.default}
        style={{ x: rawX, y: rawY, opacity: visible ? undefined : 0 }}
        aria-hidden="true"
        focusable="false"
      >
        <use href="#lysmark" />
      </motion.svg>
    </>
  );
}
