"use client";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { ScrollLink } from "@/components/ui/ScrollLink";

const CANVA = "https://cvintéractifgabrielherve.my.canva.site/podcast-la-cabane-du-lys-et-recrutement-de-membres-pour-l-quipe";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/hall-of-fame") return null;
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-top">
          <div className="foot-brand">
            <Lys />
            <h3>La Cabane du Lys</h3>
            <p>Le podcast qui démystifie l&apos;entrepreneuriat et donne la parole à celles et ceux qui bâtissent pour vrai.</p>
          </div>
          <div className="foot-col">
            <h5>L&apos;Émission</h5>
            <ScrollLink to="#manifeste">Le Manifeste</ScrollLink>
            <ScrollLink to="#coffre">Le Coffre — Épisodes</ScrollLink>
            <ScrollLink to="#salle">La Salle des Trophées</ScrollLink>
            <ScrollLink to="#diffusion">Diffusion</ScrollLink>
          </div>
          <div className="foot-col">
            <h5>Rejoindre</h5>
            <ScrollLink to="#cercle">Devenir membre</ScrollLink>
            <a href={CANVA} target="_blank" rel="noopener">Recrutement de l&apos;équipe</a>
            <ScrollLink to="#cercle">Candidater à l&apos;émission</ScrollLink>
            <ScrollLink to="#reserve">La Réserve</ScrollLink>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 La Cabane du Lys — Tous droits réservés.</span>
          <span className="loc"><MapPin size={16} /> Saint-Félicien · Saguenay–Lac-Saint-Jean</span>
        </div>
      </div>
    </footer>
  );
}
