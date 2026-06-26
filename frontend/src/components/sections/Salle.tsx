"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useGuests } from "@/lib/queries";
import { guests as mockGuests } from "@/data/guests";
import { sectorLabel } from "@/components/ui/RelicIcon";

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 110 : -110,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x:       { type: "spring", stiffness: 200, damping: 26 },
      opacity: { duration: 0.38 },
      scale:   { duration: 0.38 },
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -110 : 110,
    opacity: 0,
    scale: 0.97,
    transition: {
      x:       { type: "spring", stiffness: 200, damping: 26 },
      opacity: { duration: 0.28 },
    },
  }),
};

export function Salle() {
  const { data } = useGuests();
  const list = data ?? mockGuests;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);

  const next = () => { setDir(1);  setIdx((i) => (i + 1) % list.length); };
  const prev = () => { setDir(-1); setIdx((i) => (i - 1 + list.length) % list.length); };

  const g = list[idx];

  return (
    <section id="salle" className="salle">
      <div className="container">

        <div className="salle-carousel-head" data-reveal>
          <div>
            <span className="eyebrow">La Salle des Trophées</span>
            <h2 className="sec-title">Les <em>reliques</em> de celles<br />et ceux qui ont bâti.</h2>
          </div>
          <div className="salle-ctrl-group">
            <span className="salle-index">
              {String(idx + 1).padStart(2, "0")}
              <span className="salle-index-sep">/</span>
              {String(list.length).padStart(2, "0")}
            </span>
            <div className="salle-ctrl-btns">
              <button className="salle-ctrl-btn" onClick={prev} aria-label="Invité précédent">
                <ArrowLeft size={16} />
              </button>
              <button className="salle-ctrl-btn" onClick={next} aria-label="Invité suivant">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="salle-stage" data-reveal style={{ transitionDelay: ".1s" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={g.id}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="salle-slide"
            >
              {/* Colonne info invité */}
              <div>
                <div className="salle-badge-row">
                  <span className="salle-badge">{sectorLabel[g.sector]}</span>
                  <span className="salle-verified">
                    <ShieldCheck size={12} /> Vérifié
                  </span>
                </div>
                <h3 className="salle-guest-name">{g.name}</h3>
                <p className="salle-guest-role">
                  {g.role} · <span>{g.company}</span>
                </p>
                <blockquote className="salle-quote">« {g.quote} »</blockquote>
              </div>

              {/* Colonne fiche métrique */}
              <div className="salle-metric-card">
                <div className="salle-metric-glow" />
                <span className="salle-metric-label">Impact &amp; Performance</span>
                <div className="salle-metric-value">{g.revenue}</div>
                <div className="salle-metric-rows">
                  <div>
                    <span>Relique associée</span>
                    <span>Modèle 3D</span>
                  </div>
                  <div>
                    <span>Équipe</span>
                    <span>
                      <span className="salle-pulse" />
                      {g.employees} personnes
                    </span>
                  </div>
                </div>
                <Link href="/hall-of-fame" className="salle-cta">
                  Inspecter la Relique
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
