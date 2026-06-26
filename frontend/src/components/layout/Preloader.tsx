"use client";
import { useEffect, useState } from "react";

/** Preloader haut de gamme : le lys s'épanouit, puis le rideau se lève (cahier des charges §2.3). */
export function Preloader() {
  const [bloom, setBloom] = useState(false);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const r1 = requestAnimationFrame(() => setBloom(true));
    const t1 = setTimeout(() => {
      setDone(true);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }, reduced ? 600 : 2500);
    const t2 = setTimeout(() => setGone(true), reduced ? 1000 : 3600);
    return () => { cancelAnimationFrame(r1); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div className={`loader${bloom ? " bloom" : ""}${done ? " done" : ""}`}>
      <div className="loader-inner">
        <svg className="loader-lys" viewBox="0 0 120 150" fill="url(#bz)">
          <path data-petal="" className="p1" d="M60 5 C 66 24, 73 45, 67 63 C 65 69, 62 71, 60 73 Z" />
          <path data-petal="" className="o p2" d="M60 63 C 81 57, 94 67, 94 81 C 94 94, 88 103, 84 106 C 83 99, 79 90, 73 83 C 68 77, 63 73, 60 71 Z" />
          <path data-petal="" className="o p2" transform="matrix(-1,0,0,1,120,0)" d="M60 63 C 81 57, 94 67, 94 81 C 94 94, 88 103, 84 106 C 83 99, 79 90, 73 83 C 68 77, 63 73, 60 71 Z" />
          <path data-petal="" className="p3" d="M45 65 Q 60 60 75 65 L 75 76 Q 60 81 45 76 Z" />
          <path data-petal="" className="p4" d="M54 78 C 50 99, 57 114, 60 129 C 63 114, 70 99, 66 78 Z" />
        </svg>
        <div className="loader-word">La Cabane du Lys</div>
        <div className="loader-bar"><i /></div>
      </div>
    </div>
  );
}
