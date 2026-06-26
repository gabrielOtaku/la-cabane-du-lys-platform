"use client";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface LenisCtx {
  scrollTo: (target: string | HTMLElement, offset?: number) => void;
}
const Ctx = createContext<LenisCtx>({ scrollTo: () => {} });
export const useLenis = () => useContext(Ctx);

/** Défilement adouci « luxueux » (cahier des charges §2.3). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const scrollTo = (target: string | HTMLElement, offset = -10) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el as HTMLElement, { offset, duration: 1.3 });
    else (el as HTMLElement).scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return <Ctx.Provider value={{ scrollTo }}>{children}</Ctx.Provider>;
}
