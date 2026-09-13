"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useGuests, useEpisodes } from "@/lib/queries";
import { guests as mockGuests } from "@/data/guests";
import { episodes as mockEpisodes } from "@/data/episodes";
import { withDevFallback } from "@/lib/fixtures";
import { MagneticButton } from "@/components/ui/MagneticButton";

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
  const list = withDevFallback(data, mockGuests, []);
  const { data: apiEpisodes } = useEpisodes();
  const allEpisodes = withDevFallback(apiEpisodes, mockEpisodes, []);

  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);

  const next = () => { setDir(1);  setIdx((i) => (i + 1) % list.length); };
  const prev = () => { setDir(-1); setIdx((i) => (i - 1 + list.length) % list.length); };

  const g = list[idx];
  if (!g) return null;

  const linkedEpisode = allEpisodes.find((e) => e.guests.some((gu) => gu.slug === g.slug || gu.id === g.id));
  const episodeIsLive = linkedEpisode?.status === "PUBLISHED";
  const ancrage = [g.city, g.region].filter(Boolean).join(", ");

  return (
    <section id="salle" className="salle">
      <div className="container">

        <div className="salle-carousel-head" data-reveal>
          <div>
            <span className="eyebrow">La Salle — Invités</span>
            <h2 className="sec-title">Les parcours de celles<br />et ceux qui ont bâti.</h2>
          </div>
          <div className="salle-ctrl-group">
            <span className="salle-index">
              {String(idx + 1).padStart(2, "0")}
              <span className="salle-index-sep">/</span>
              {String(list.length).padStart(2, "0")}
            </span>
            <div className="salle-ctrl-btns">
              <button type="button" className="salle-ctrl-btn" onClick={prev} aria-label="Invité précédent">
                <ArrowLeft size={16} />
              </button>
              <button type="button" className="salle-ctrl-btn" onClick={next} aria-label="Invité suivant">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="salle-stage salle-stage--delayed" data-reveal>
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
                  {g.category && <span className="salle-badge">{g.category}</span>}
                  {ancrage && (
                    <span className="salle-verified">
                      <MapPin size={12} /> {ancrage}
                    </span>
                  )}
                </div>
                <h3 className="salle-guest-name">{g.name}</h3>
                <p className="salle-guest-role">
                  {g.role} · <span>{g.company}</span>
                </p>
                {g.quote && <blockquote className="salle-quote">« {g.quote} »</blockquote>}
              </div>

              {/* Colonne parcours */}
              <div className="salle-metric-card">
                <div className="salle-metric-glow" />
                <span className="salle-metric-label">Ce que l&apos;on explore</span>
                <div className="salle-metric-value" style={{ fontSize: "1.05rem", lineHeight: 1.4 }}>
                  {g.angle ?? "Parcours entrepreneurial à découvrir."}
                </div>
                <MagneticButton style={{ display: "block" }}>
                  {episodeIsLive ? (
                    <Link href={`/episodes/${linkedEpisode!.slug}`} className="salle-cta">
                      Voir l&apos;épisode
                    </Link>
                  ) : (
                    <Link href={`/invites/${g.slug}`} className="salle-cta">
                      Découvrir le parcours
                    </Link>
                  )}
                </MagneticButton>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
