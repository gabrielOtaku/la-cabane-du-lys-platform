"use client";
import { useEffect } from "react";

/** Effets 3D au survol : cartes [data-tilt] + carte membre #memberCard. Desktop uniquement. */
export function TiltEffects() {
  useEffect(() => {
    if (window.matchMedia("(hover:none),(pointer:coarse)").matches) return;
    const cleanups: Array<() => void> = [];

    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-4px)`;
      };
      const leave = () => { card.style.transform = ""; };
      card.addEventListener("mousemove", move);
      card.addEventListener("mouseleave", leave);
      cleanups.push(() => { card.removeEventListener("mousemove", move); card.removeEventListener("mouseleave", leave); });
    });

    const mc = document.getElementById("memberCard");
    if (mc) {
      const move = (e: MouseEvent) => {
        const r = mc.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        mc.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg)`;
      };
      const leave = () => { mc.style.transform = "perspective(900px) rotateY(0) rotateX(0)"; };
      mc.addEventListener("mousemove", move);
      mc.addEventListener("mouseleave", leave);
      cleanups.push(() => { mc.removeEventListener("mousemove", move); mc.removeEventListener("mouseleave", leave); });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);
  return null;
}
