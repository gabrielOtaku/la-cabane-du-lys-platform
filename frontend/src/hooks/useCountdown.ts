"use client";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Compte à rebours vers une date persistée. `expired` passe à true quand la cible est atteinte :
 * l'appelant peut alors rafraîchir l'état côté serveur. Rendu neutre avant hydratation.
 */
export function useCountdown(target: Date | null) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = target ? target.getTime() - now : 0;
  const s = Math.max(0, Math.floor(diffMs / 1000));

  return {
    mounted,
    expired: mounted && target !== null && diffMs <= 0,
    d: mounted ? pad(Math.floor(s / 86400)) : "00",
    h: mounted ? pad(Math.floor((s % 86400) / 3600)) : "00",
    m: mounted ? pad(Math.floor((s % 3600) / 60)) : "00",
    s: mounted ? pad(s % 60) : "00",
  };
}
