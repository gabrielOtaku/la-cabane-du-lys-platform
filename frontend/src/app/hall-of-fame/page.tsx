"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Rotate3d } from "lucide-react";
import { guests } from "@/data/guests";

const HallOfFame = dynamic(
  () => import("@/components/3d/HallOfFame").then((m) => m.HallOfFame),
  {
    ssr: false,
    loading: () => (
      <div style={{
        position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 2,
      }}>
        <span style={{
          color: "var(--bronze)", fontSize: "0.65rem",
          letterSpacing: "0.28em", textTransform: "uppercase",
        }}>
          Préparation de la salle…
        </span>
      </div>
    ),
  }
);

export default function HallOfFamePage() {
  return (
    <>
      {/* Bouton retour — sous le header, ne chevauche pas les fiches */}
      <nav className="hall-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={13} /> Retour à l&apos;Édifice
        </Link>
      </nav>

      {/* Canvas 3D — plein écran, derrière le header */}
      <div className="hall-wrap">
        <HallOfFame guests={guests} />
      </div>

      {/* Titre — ancré bas-gauche pour libérer l'espace des fiches holographiques */}
      <div className="hall-label" aria-hidden>
        <span className="hall-eyebrow">Hall of Fame · La Reliquaire</span>
        <h1>La Salle des <em>Trophées</em></h1>
        <p>Cliquez sur une relique pour révéler sa fiche.</p>
      </div>

      {/* Indicateur navigation — bas-centre */}
      <div className="hall-tip">
        <Rotate3d size={13} />
        Glissez &middot; Molette pour zoomer
      </div>
    </>
  );
}
