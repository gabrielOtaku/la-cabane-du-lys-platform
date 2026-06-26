"use client";
import type { ReactNode } from "react";
import { useLenis } from "@/components/layout/SmoothScroll";

/** Lien d'ancrage avec défilement adouci (Lenis) et repli natif. */
export function ScrollLink({ to, className, children, onNavigate }: {
  to: string; className?: string; children: ReactNode; onNavigate?: () => void;
}) {
  const { scrollTo } = useLenis();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (to.startsWith("#")) { e.preventDefault(); scrollTo(to); onNavigate?.(); }
      }}
    >
      {children}
    </a>
  );
}
