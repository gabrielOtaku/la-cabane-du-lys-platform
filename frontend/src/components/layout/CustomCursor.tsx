"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useMotionValue } from "framer-motion";
import { fireflyBurst } from "@/features/effects/fireflies";

/**
 * Curseur fleur de lys V2 (feuille de route, phase 4 — révision du 2026-09-14 : « juste la fleur »).
 *
 *  - Symbole SVG partagé (#lysmark, voir LysDefs) : net à toute échelle, recolorable.
 *  - Une seule pièce : la fleur, sans halo ni anneau. Sa pointe supérieure est le point actif.
 *  - Modes : default · link · button · text (curseur natif dans les champs) · play · pause · 3d,
 *    exprimés uniquement par l'échelle, l'inclinaison et l'opacité de la fleur.
 *  - Lucioles au clic ; variante Play : elles convergent vers la waveform du lecteur.
 *  - Désactivé sur écran tactile et avec « mouvement réduit » : le curseur natif reste disponible.
 *  - Le calque n'intercepte jamais les clics (pointer-events: none).
 */

type CursorMode = "default" | "link" | "button" | "text" | "magnetic" | "3d" | "play" | "pause";

const LYS_WIDTH = 28;                 // px sur bureau (largeur ; le symbole est au ratio 120 × 150)
const LYS_HEIGHT = LYS_WIDTH * 1.25;

const LYS: Record<CursorMode, { scale: number; opacity: number; rotate: number }> = {
  default:  { scale: 1,    opacity: 1,    rotate: 0 },
  link:     { scale: 1.15, opacity: 1,    rotate: -8 },
  button:   { scale: 1.2,  opacity: 1,    rotate: -8 },
  magnetic: { scale: 1.2,  opacity: 1,    rotate: -8 },
  text:     { scale: 0.7,  opacity: 0,    rotate: 0 },
  "3d":     { scale: 1.1,  opacity: 0.95, rotate: 0 },
  play:     { scale: 1.1,  opacity: 0.95, rotate: 0 },
  pause:    { scale: 1.1,  opacity: 0.95, rotate: 0 },
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

  const modeRef = useRef<CursorMode>("default");
  const [visible, setVisible] = useState(false);
  const lysCtrl = useAnimationControls();

  const switchMode = useCallback((m: CursorMode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    document.documentElement.dataset.cursorMode = m;
    lysCtrl.start({ ...LYS[m], transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } });
  }, [lysCtrl]);

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

      // Léger appui de la fleur (retour visuel court, famille « Luciole »).
      const base = LYS[m].scale;
      lysCtrl.start({
        scale: [base, base * 0.82, base],
        transition: { duration: 0.28, times: [0, 0.3, 1], ease: "easeOut" },
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
  }, [rawX, rawY, switchMode, lysCtrl]);

  return (
    // Fleur de lys — position instantanée ; la pointe supérieure coïncide avec le pointeur.
    <motion.svg
      className="cursor-lys"
      viewBox="0 0 120 150"
      width={LYS_WIDTH}
      height={LYS_HEIGHT}
      animate={lysCtrl}
      initial={LYS.default}
      style={{ x: rawX, y: rawY, marginLeft: -LYS_WIDTH / 2, marginTop: -1, opacity: visible ? undefined : 0 }}
      aria-hidden="true"
      focusable="false"
    >
      <use href="#lysmark" />
    </motion.svg>
  );
}
