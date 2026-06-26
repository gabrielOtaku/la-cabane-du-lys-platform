"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useAnimationControls,
} from "framer-motion";

type CursorMode = "default" | "magnetic" | "3d" | "play" | "pause";

// Ressort pour l'inertie du halo
const SPRING = { stiffness: 90, damping: 22, mass: 0.5 };

// Variantes ring par mode
const RING_V: Record<CursorMode, object> = {
  default:  { scale: 1,   borderColor: "rgba(255,170,0,0.70)" },
  magnetic: { scale: 2.4, borderColor: "rgba(255,170,0,0.95)" },
  "3d":     { scale: 1.8, borderColor: "rgba(255,170,0,0.40)" },
  play:     { scale: 2.0, borderColor: "rgba(255,170,0,0.80)" },
  pause:    { scale: 2.0, borderColor: "rgba(255,170,0,0.80)" },
};

// Variantes dot par mode
const DOT_V: Record<CursorMode, object> = {
  default:  { scale: 1, opacity: 1 },
  magnetic: { scale: 0, opacity: 0 },
  "3d":     { scale: 0, opacity: 0 },
  play:     { scale: 0, opacity: 0 },
  pause:    { scale: 0, opacity: 0 },
};

export function CustomCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const ringX = useSpring(rawX, SPRING);
  const ringY = useSpring(rawY, SPRING);

  const [mode, setMode]       = useState<CursorMode>("default");
  const modeRef               = useRef<CursorMode>("default");
  const ringCtrl              = useAnimationControls();
  const dotCtrl               = useAnimationControls();
  const [visible, setVisible] = useState(false);

  const switchMode = useCallback((m: CursorMode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setMode(m);
    const ease = [0.16, 1, 0.3, 1] as const;
    ringCtrl.start({ ...RING_V[m], transition: { duration: 0.28, ease } });
    dotCtrl.start({ ...DOT_V[m],  transition: { duration: 0.20, ease } });
  }, [ringCtrl, dotCtrl]);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      // data-cursor prend la priorité
      const tagged = t.closest("[data-cursor]") as HTMLElement | null;
      if (tagged?.dataset.cursor) {
        switchMode(tagged.dataset.cursor as CursorMode);
        return;
      }
      if (t.closest("a, button, [role='button'], label")) {
        switchMode("magnetic");
        return;
      }
      switchMode("default");
    };

    // Clic : contraction + vague lumineuse
    const onDown = () => {
      const v = RING_V[modeRef.current] as { scale: number };
      const base = v?.scale ?? 1;
      ringCtrl.start({
        scale:     [base, 0.32, base],
        boxShadow: [
          "0 0 0 0px rgba(255,150,50,0.85)",
          "0 0 0 16px rgba(255,110,30,0.35)",
          "0 0 0 32px rgba(255,80,20,0)",
        ],
        transition: { duration: 0.52, times: [0, 0.22, 1], ease: "easeOut" },
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawX, rawY, switchMode, ringCtrl]);

  return (
    <>
      {/* ── Halo magnétique (inertie via ressort) ─────────────────────── */}
      <motion.div
        animate={ringCtrl}
        initial={{ scale: 1, borderColor: "rgba(255,170,0,0.70)" }}
        style={{
          position:     "fixed",
          top:          0,
          left:         0,
          width:        30,
          height:       30,
          marginLeft:   -15,
          marginTop:    -15,
          x:            ringX,
          y:            ringY,
          borderRadius: "50%",
          border:       "1.5px solid rgba(255,170,0,0.70)",
          background:   "radial-gradient(circle, rgba(255,140,40,0.13) 0%, transparent 70%)",
          filter:       "blur(0.5px)",
          pointerEvents:"none",
          zIndex:       9999,
          mixBlendMode: "screen",
          willChange:   "transform",
          opacity:      visible ? 1 : 0,
          transition:   "opacity 0.3s",
        }}
      >
        {/* Texte en orbite — mode 3D uniquement */}
        {mode === "3d" && (
          <motion.div
            style={{ position: "absolute", inset: -30, pointerEvents: "none" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 90 90" width="90" height="90" aria-hidden>
              <defs>
                <path id="orb-path"
                  d="M 45,45 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                />
              </defs>
              <text
                fill="rgba(255,185,60,0.88)"
                fontSize="7"
                fontFamily="var(--serif)"
                letterSpacing="1.8"
              >
                <textPath href="#orb-path">
                  VOIR LA RELIQUE • VOIR LA RELIQUE •
                </textPath>
              </text>
            </svg>
          </motion.div>
        )}

        {/* Icône lecteur — modes play / pause */}
        {(mode === "play" || mode === "pause") && (
          <motion.span
            key={mode}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            style={{
              position:       "absolute",
              inset:          0,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       11,
              color:          "rgba(255,200,80,1)",
              filter:         "drop-shadow(0 0 5px rgba(255,170,0,0.9))",
              pointerEvents:  "none",
            }}
          >
            {mode === "play" ? "▶" : "⏸"}
          </motion.span>
        )}
      </motion.div>

      {/* ── Noyau — point blanc, position instantanée ─────────────────── */}
      <motion.div
        animate={dotCtrl}
        initial={{ scale: 1 }}
        style={{
          position:     "fixed",
          top:          0,
          left:         0,
          width:        4,
          height:       4,
          marginLeft:   -2,
          marginTop:    -2,
          x:            rawX,
          y:            rawY,
          borderRadius: "50%",
          background:   "rgba(255,255,255,0.96)",
          boxShadow:    "0 0 5px rgba(255,255,255,0.45)",
          pointerEvents:"none",
          zIndex:       10000,
          willChange:   "transform",
          opacity:      visible ? 1 : 0,
          transition:   "opacity 0.3s",
        }}
      />
    </>
  );
}
